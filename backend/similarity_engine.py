import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


class SimilarityEngine:
    def __init__(self, vectorizer, job_tfidf_matrix, job_sbert_embeddings=None, df_jobs=None):
        self.vectorizer = vectorizer
        self.job_tfidf_matrix = job_tfidf_matrix
        self.job_sbert_embeddings = job_sbert_embeddings  # shape (n_jobs, dim)
        self.df_jobs = df_jobs.reset_index(drop=True) if df_jobs is not None else None
        self._sbert_model = None
        self._sbert_attempted = False

    # Lazy-load SBERT encoder; hanya coba sekali agar tidak spam log
    def _load_sbert(self):
        if self._sbert_attempted:
            return self._sbert_model
        self._sbert_attempted = True
        try:
            from sentence_transformers import SentenceTransformer
            self._sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ SBERT encoder loaded.")
        except Exception as e:
            print(f"⚠️ SBERT encoder not available: {e}")
        return self._sbert_model

    def get_matches(self, resume_text: str, top_k: int = 10) -> dict:
        # --- TF-IDF similarity ---
        resume_vec = self.vectorizer.transform([resume_text])
        tfidf_scores = cosine_similarity(resume_vec, self.job_tfidf_matrix).flatten()

        # --- SBERT similarity (opsional) ---
        sbert_scores = None
        if self.job_sbert_embeddings is not None:
            sbert_model = self._load_sbert()
            if sbert_model is not None:
                query_emb = sbert_model.encode([resume_text], normalize_embeddings=True)
                sbert_scores = cosine_similarity(query_emb, self.job_sbert_embeddings).flatten()

        # --- Combined score (weighted average) ---
        if sbert_scores is not None:
            combined = 0.6 * tfidf_scores + 0.4 * sbert_scores
        else:
            combined = tfidf_scores

        top_indices = combined.argsort()[::-1][:top_k]

        # --- Kolom metadata dari df_jobs ---
        title_col = None
        skills_col = None
        if self.df_jobs is not None:
            cols = self.df_jobs.columns.tolist()
            title_col = next((c for c in cols if "title" in c.lower()), None)
            skills_col = next(
                (c for c in cols if "skill" in c.lower() and c != title_col), None
            )

        matches = []
        for rank, idx in enumerate(top_indices, 1):
            entry = {
                "rank": rank,
                "job_title": f"Job #{int(idx) + 1}",
                "match_score_tfidf": round(float(tfidf_scores[idx]), 4),
                "combined_score": round(float(combined[idx]), 4),
                "required_skills": [],
            }

            if sbert_scores is not None:
                entry["match_score_sbert"] = round(float(sbert_scores[idx]), 4)

            if self.df_jobs is not None and int(idx) < len(self.df_jobs):
                row = self.df_jobs.iloc[int(idx)]
                if title_col:
                    entry["job_title"] = str(row[title_col])
                if skills_col:
                    raw = row[skills_col]
                    if isinstance(raw, list):
                        entry["required_skills"] = raw
                    elif isinstance(raw, str):
                        entry["required_skills"] = [s.strip() for s in raw.split(",") if s.strip()]

            matches.append(entry)

        return {"matches": matches, "total_matches": len(matches)}

    # Utilitas: hitung skor antara dua teks (untuk keperluan internal)
    def get_score(self, text_a: str, text_b: str) -> float:
        vecs = self.vectorizer.transform([text_a, text_b])
        return float(cosine_similarity(vecs[0:1], vecs[1:2])[0][0])
