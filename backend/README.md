# SkillBridge Backend API

## Arsitektur Sistem

```text
CV Upload
    ↓
Skill Extractor
    ↓
Skill Normalization
    ↓
Similarity Engine
    ↓
Gap Analysis
    ↓
Recommendation Engine
    ↓
API (FastAPI)
    ↓
Frontend Dashboard
```

## Struktur Direktori

- `app.py`: Titik masuk FastAPI dan endpoints API (`POST /analyze`).
- `skill_extractor.py`: Logika untuk membersihkan teks dan mengekstrak skills dari teks (Hybrid Rule-based + NER).
- `similarity_engine.py`: Mesin pencocokan resume dengan job postings (Cosine Similarity).
- `gap_analysis.py`: Logika pencarian gap skills dan rekomendasi resource IBM SkillsBuild.
- `models/`: Folder penempatan artifact model dari notebook (e.g. `tfidf_vectorizer.pkl`, `job_tfidf_matrix.npz`, dll).

## Cara Menjalankan

1. Ekspor model artifact dari notebook (.pkl, .npz, .parquet, .json) dan pastikan disimpan di `models/`.
2. Instal dependensi:
   ```bash
   pip install fastapi uvicorn scikit-learn pandas numpy spacy pydantic pyarrow fastparquet
   ```
3. Unduh model spacy (opsional jika dibutuhkan oleh extractor, walau kita memakai rule-based di modul ini):
   ```bash
   python -m spacy download en_core_web_sm
   ```
4. Jalankan FastAPI:

   ```bash
   cd backend
   uvicorn app:app --reload
   ```

5. Akses Swagger UI untuk testing di: `http://127.0.0.1:8000/docs`
