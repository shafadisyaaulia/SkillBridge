import json
import os
import pickle
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import numpy as np
import scipy.sparse as sp
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from gap_analysis import GapAnalyzer
from similarity_engine import SimilarityEngine
from skill_extractor import (
    SkillExtractor,
    clean_text,
    extract_text_from_docx,
    extract_text_from_pdf,
)

# ─── Config ───────────────────────────────────────────────────────────────────

MODELS_DIR = Path(os.getenv("MODELS_DIR", "models"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024

# ─── Global state (diisi saat startup) ────────────────────────────────────────

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_models()
    yield
    state.clear()


def _load_models():
    try:
        with open(MODELS_DIR / "skill_taxonomy.json") as f:
            skill_taxonomy = json.load(f)
        with open(MODELS_DIR / "learning_resources.json") as f:
            learning_resources = json.load(f)
        with open(MODELS_DIR / "tfidf_vectorizer.pkl", "rb") as f:
            tfidf_vectorizer = pickle.load(f)

        job_tfidf_matrix = sp.load_npz(MODELS_DIR / "job_tfidf_matrix.npz")
        job_sbert_embeddings = np.load(MODELS_DIR / "job_sbert_embeddings.npy")

        # Opsional: metadata pekerjaan (parquet)
        df_jobs = None
        parquet_path = MODELS_DIR / "df_postings_processed.parquet"
        if parquet_path.exists():
            import pandas as pd
            df_jobs = pd.read_parquet(parquet_path)
            print(f"[OK] Job postings metadata loaded ({len(df_jobs):,} rows)")

        state["extractor"] = SkillExtractor(skill_taxonomy)
        state["engine"] = SimilarityEngine(
            tfidf_vectorizer, job_tfidf_matrix, job_sbert_embeddings, df_jobs
        )
        state["gap_analyzer"] = GapAnalyzer(skill_taxonomy, learning_resources)
        print("[OK] All models loaded successfully!")
    except Exception as e:
        print(f"[ERROR] Error loading models: {e}")
        print(f"        Pastikan semua file model ada di folder: {MODELS_DIR.resolve()}")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SkillBridge API",
    description=(
        "AI-Driven Career Path & Gap Analysis Recommendation\n\n"
        "Capstone Project — Pijak x IBM SkillsBuild"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic schemas ─────────────────────────────────────────────────────────


class JobMatchRequest(BaseModel):
    skills: List[str] = Field(..., example=["python", "machine learning", "sql"])
    top_n: int = Field(10, ge=1, le=50, example=10)


class GapAnalysisRequest(BaseModel):
    user_skills: List[str] = Field(..., example=["python", "sql", "html"])
    target_job_skills: List[str] = Field(
        ..., example=["python", "sql", "tensorflow", "statistics", "docker"]
    )


class LearningPathRequest(BaseModel):
    missing_skills: List[str] = Field(
        ..., example=["tensorflow", "statistics", "docker"]
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _models_ready() -> bool:
    return all(k in state for k in ("extractor", "engine", "gap_analyzer"))


def _err(message: str, detail: str = "", code: int = 500) -> JSONResponse:
    return JSONResponse(
        status_code=code,
        content={"status": "error", "message": message, "detail": detail},
    )


def _parse_file(content: bytes, ext: str) -> str:
    if ext == "pdf":
        return extract_text_from_pdf(content)
    return extract_text_from_docx(content)


def _flatten_unique(skills_by_category: dict) -> list:
    # Gabungkan semua kategori jadi satu list tanpa duplikat (urutan dijaga).
    # Beberapa skill (mis. "creative") tercatat di >1 kategori.
    seen = set()
    out = []
    for skills in skills_by_category.values():
        for s in skills:
            if s not in seen:
                seen.add(s)
                out.append(s)
    return out


# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/", tags=["Health"], summary="Health check")
def root():
    return {
        "status": "ok",
        "message": "SkillBridge API is running",
        "models_loaded": _models_ready(),
        "docs": "/docs",
    }


# ─── 1. Resume Upload & Parse ─────────────────────────────────────────────────


@app.post(
    "/api/v1/resume/upload",
    tags=["Resume"],
    summary="Upload CV (PDF/DOCX) and extract skills",
)
async def upload_resume(file: UploadFile = File(...)):
    """
    Accepts a PDF or DOCX resume. Returns extracted raw text, skills by category,
    and a flat skill list.
    """
    if not _models_ready():
        return _err("Models not loaded", "Check models/ folder", 503)

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        return _err("Unsupported file type", "Only PDF and DOCX are accepted", 400)

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        return _err("File too large", f"Maximum {MAX_UPLOAD_BYTES // 1024 // 1024}MB", 413)

    try:
        raw_text = _parse_file(content, ext)
        if not raw_text.strip():
            return _err("Could not extract text", "The file appears to be empty or image-based", 422)

        cleaned = clean_text(raw_text)
        extractor: SkillExtractor = state["extractor"]
        skills_by_category = extractor.extract(cleaned)
        extracted_skills = _flatten_unique(skills_by_category)

        return {
            "status": "success",
            "data": {
                "raw_text": raw_text[:5000],  # batasi agar response tidak terlalu besar
                "extracted_skills": extracted_skills,
                "skill_count": len(extracted_skills),
                "skills_by_category": skills_by_category,
            },
        }
    except Exception as e:
        return _err("Failed to process resume", str(e))


# ─── 2. Job Matching ──────────────────────────────────────────────────────────


@app.post(
    "/api/v1/match/jobs",
    tags=["Matching"],
    summary="Match user skills against job database",
)
def match_jobs(req: JobMatchRequest):
    """
    Transforms skill list into a query vector, then computes cosine similarity
    against all jobs using TF-IDF (and SBERT if available).
    Returns top-N job matches with scores.
    """
    if not _models_ready():
        return _err("Models not loaded", code=503)

    try:
        engine: SimilarityEngine = state["engine"]
        skill_text = " ".join(req.skills)
        result = engine.get_matches(skill_text, top_k=req.top_n)
        return {"status": "success", "data": result}
    except Exception as e:
        return _err("Job matching failed", str(e))


# ─── 3. Gap Analysis ──────────────────────────────────────────────────────────


@app.post(
    "/api/v1/analysis/gap",
    tags=["Analysis"],
    summary="Compare user skills vs target job requirements",
)
def gap_analysis(req: GapAnalysisRequest):
    """
    Returns matched skills, missing skills, match percentage, gap by category,
    and radar chart data for visualization.
    """
    if not _models_ready():
        return _err("Models not loaded", code=503)

    try:
        gap_analyzer: GapAnalyzer = state["gap_analyzer"]
        result = gap_analyzer.analyze(req.user_skills, req.target_job_skills)
        return {"status": "success", "data": result}
    except Exception as e:
        return _err("Gap analysis failed", str(e))


# ─── 4. Learning Path Recommendation ─────────────────────────────────────────


@app.post(
    "/api/v1/recommend/learning",
    tags=["Recommendations"],
    summary="Get IBM SkillsBuild course recommendations for missing skills",
)
def recommend_learning(req: LearningPathRequest):
    """
    Maps each missing skill to an IBM SkillsBuild course. Skills with no
    matching resource are returned in `skills_not_covered`.
    """
    if not _models_ready():
        return _err("Models not loaded", code=503)

    try:
        gap_analyzer: GapAnalyzer = state["gap_analyzer"]
        result = gap_analyzer.recommend(req.missing_skills)
        return {"status": "success", "data": result}
    except Exception as e:
        return _err("Learning recommendation failed", str(e))


# ─── 5. Full Pipeline (Bonus) ─────────────────────────────────────────────────


@app.post(
    "/api/v1/analyze/full",
    tags=["Full Pipeline"],
    summary="End-to-end: upload CV → match jobs → gap analysis → learning path",
)
async def full_pipeline(
    file: UploadFile = File(...),
    target_category: Optional[str] = Form(None),
):
    """
    Single endpoint that runs the complete SkillBridge pipeline:
    1. Parse resume
    2. Extract skills
    3. Match against job database
    4. Perform gap analysis against top match
    5. Recommend learning resources
    """
    if not _models_ready():
        return _err("Models not loaded", code=503)

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        return _err("Unsupported file type", "Only PDF and DOCX are accepted", 400)

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        return _err("File too large", f"Maximum {MAX_UPLOAD_BYTES // 1024 // 1024}MB", 413)

    try:
        raw_text = _parse_file(content, ext)
        if not raw_text.strip():
            return _err("Could not extract text", "File appears empty or image-based", 422)

        cleaned = clean_text(raw_text)
        extractor: SkillExtractor = state["extractor"]
        engine: SimilarityEngine = state["engine"]
        gap_analyzer: GapAnalyzer = state["gap_analyzer"]

        # Step 1: Extract skills
        skills_by_category = extractor.extract(cleaned)
        user_skills = _flatten_unique(skills_by_category)

        # Step 2: Match jobs
        skill_text = " ".join(user_skills) + " " + cleaned
        job_match_result = engine.get_matches(skill_text, top_k=5)

        # Step 3: Gap analysis against top matched job
        top_match = (
            job_match_result["matches"][0] if job_match_result["matches"] else None
        )
        target_job_skills = top_match.get("required_skills", []) if top_match else []
        gap_result = gap_analyzer.analyze(user_skills, target_job_skills)

        # Step 4: Learning recommendations for missing skills
        learning_result = gap_analyzer.recommend(gap_result["missing_skills"])

        return {
            "status": "success",
            "data": {
                "resume_parse": {
                    "extracted_skills": user_skills,
                    "skill_count": len(user_skills),
                    "skills_by_category": skills_by_category,
                },
                "job_matches": job_match_result,
                "gap_analysis": gap_result,
                "learning_recommendations": learning_result,
            },
        }
    except Exception as e:
        return _err("Full pipeline failed", str(e))
