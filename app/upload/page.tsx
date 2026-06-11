"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
  Upload,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  ArrowRight,
  Home,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tipe response dari backend FastAPI (/api/v1/analyze/full)            */
/* ------------------------------------------------------------------ */
interface JobMatch {
  rank: number;
  job_title: string;
  match_score_tfidf: number;
  match_score_sbert?: number;
  combined_score: number;
  required_skills: string[];
}

interface LearningResource {
  title: string;
  provider: string;
  url: string;
  level: string;
}

interface AnalysisResult {
  resume_parse: {
    extracted_skills: string[];
    skill_count: number;
    skills_by_category: Record<string, string[]>;
  };
  job_matches: {
    matches: JobMatch[];
    total_matches: number;
  };
  gap_analysis: {
    match_percentage: number;
    matched_skills: string[];
    missing_skills: string[];
    gap_by_category: Record<string, string[]>;
  };
  learning_recommendations: {
    recommendations: { skill: string; resources: LearningResource[] }[];
    total_skills_covered: number;
    skills_not_covered: string[];
  };
}

// URL backend — bisa di-override lewat .env.local (NEXT_PUBLIC_API_URL)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFormats = [".pdf", ".docx"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB (samakan dengan limit backend)

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError("");
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    // Validate format
    if (!allowedFormats.includes(fileExtension)) {
      setError("Format file tidak didukung. Gunakan PDF atau DOCX.");
      return;
    }

    // Validate size
    if (file.size > maxFileSize) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }

    setUploadedFile(file);
    analyzeResume(file);
  };

  // Kirim file ke backend FastAPI dan ambil hasil analisis lengkap
  const analyzeResume = async (file: File) => {
    setUploading(true);
    setUploadSuccess(false);
    setResult(null);
    setUploadProgress(0);

    // Animasi progress sambil menunggu response (request pertama bisa lama
    // karena backend memuat model SBERT)
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/v1/analyze/full`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok && json.status === "success") {
        setResult(json.data as AnalysisResult);
        setUploadSuccess(true);
      } else {
        setError(json.message || json.detail || "Analisis gagal. Coba lagi.");
        setUploadedFile(null);
      }
    } catch {
      clearInterval(interval);
      setError(
        `Tidak bisa terhubung ke server. Pastikan backend berjalan di ${API_URL}.`
      );
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadSuccess(false);
    setShowResults(false);
    setUploadProgress(0);
    setError("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAnother = () => {
    handleRemoveFile();
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        background: "#f8fbff",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,128,255,0.16) 0%, transparent 70%)",
          top: "-10%",
          left: "-15%",
          filter: "blur(80px)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(96,194,255,0.14) 0%, transparent 70%)",
          top: "10%",
          left: "55%",
          filter: "blur(80px)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,208,255,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "30%",
          filter: "blur(80px)",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "16px 28px",
          background: "rgba(248, 251, 255, 0.9)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#48658f",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#48658f")}
          >
            <Home size={18} />
            Kembali ke Beranda
          </Link>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            SkillBridge
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "64px 28px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Upload CV Anda
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#48658f",
              letterSpacing: "0.01em",
            }}
          >
            Unggah CV Anda untuk mendapatkan analisis mendalam dan rekomendasi karir yang dipersonalisasi
          </p>
        </div>

        {/* Upload Area */}
        {!showResults && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              padding: "48px 28px",
              borderRadius: 20,
              border: `2px dashed ${dragActive ? "#60c2ff" : "rgba(148,163,184,0.32)"}`,
              background: dragActive
                ? "rgba(96, 194, 255, 0.08)"
                : "rgba(255,255,255,0.92)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              marginBottom: 24,
              boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
            }}
          >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {!uploadedFile ? (
            <>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #4f80ff 0%, #60c2ff 100%)",
                  marginBottom: 20,
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} color="#ffffff" strokeWidth={1.5} />
              </div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                Drag dan drop CV Anda di sini
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "#48658f",
                  marginBottom: 16,
                }}
              >
                atau
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.05)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(15,23,42,0.08)";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.32)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(15,23,42,0.05)";
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.2)";
                }}
              >
                Pilih File
              </button>
            </>
          ) : (
            <div>
              <FileText size={48} color="#4f80ff" style={{ marginBottom: 16 }} />
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                {uploadedFile.name}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#48658f",
                  marginBottom: 20,
                }}
              >
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>

              {uploading && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      borderRadius: 4,
                      background: "rgba(148,163,184,0.18)",
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "linear-gradient(90deg, #4f80ff, #60c2ff)",
                        width: `${uploadProgress}%`,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 13, color: "#48658f" }}>
                    {Math.round(uploadProgress)}% Upload...
                  </p>
                </div>
              )}

              {uploadSuccess && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 20,
                    color: "#059669",
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    Berhasil di-upload!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Format info */}
          <p
            style={{
              fontSize: 12,
              color: "#48658f",
              marginTop: 20,
            }}
          >
            Format: PDF, DOCX • Maksimal ukuran: 10MB
          </p>
        </div>
        )}

        {/* Error Message */}
        {error && !showResults && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 16,
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              marginBottom: 24,
            }}
          >
            <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2 }} />
            <div>
              <p
                style={{
                  fontSize: 14,
                  color: "#991b1b",
                  fontWeight: 600,
                }}
              >
                Error
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#b91c1c",
                  marginTop: 4,
                }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {uploadSuccess && !showResults && (
          <button
            onClick={() => setShowResults(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #4f80ff 0%, #60c2ff 100%)",
              border: "none",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 8px 28px rgba(79,128,255,0.4)",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Lihat Hasil Analisis
            <ArrowRight size={18} />
          </button>
        )}

        {/* Results Section */}
        {showResults && result && (
          <div style={{ marginTop: 48 }}>
            {/* Results Header */}
            <div style={{ marginBottom: 40, textAlign: "center" }}>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                Hasil Analisis CV
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "#48658f",
                }}
              >
                {uploadedFile?.name}
              </p>
            </div>

            {/* Analysis Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 20,
                marginBottom: 32,
              }}
            >
              {/* Overall Score */}
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#48658f",
                    marginBottom: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Skill Terdeteksi
                </p>
                <p
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#60c2ff",
                    marginBottom: 8,
                  }}
                >
                  {result.resume_parse.skill_count}
                </p>
                <p style={{ fontSize: 13, color: "#48658f" }}>
                  skill berhasil diekstrak dari CV
                </p>
              </div>

              {/* Skill Match */}
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#48658f",
                    marginBottom: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Kecocokan Skill
                </p>
                <p
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#4f80ff",
                    marginBottom: 8,
                  }}
                >
                  {result.gap_analysis.match_percentage}%
                </p>
                <p style={{ fontSize: 13, color: "#48658f" }}>
                  terhadap lowongan terbaik
                </p>
              </div>

              {/* Experience Level */}
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#48658f",
                    marginBottom: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Lowongan Cocok
                </p>
                <p
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#93c8ff",
                    marginBottom: 8,
                  }}
                >
                  {result.job_matches.total_matches}
                </p>
                <p style={{ fontSize: 13, color: "#48658f" }}>
                  lowongan paling relevan
                </p>
              </div>

              {/* Top Skills */}
              <div
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#48658f",
                    marginBottom: 16,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Top Skills
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.resume_parse.extracted_skills.length === 0 ? (
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>
                      Tidak ada skill terdeteksi.
                    </span>
                  ) : (
                    result.resume_parse.extracted_skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: "inline-block",
                          padding: "6px 14px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "rgba(79, 128, 255, 0.12)",
                          color: "#2457c5",
                          border: "1px solid rgba(79, 128, 255, 0.24)",
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Rekomendasi Lowongan (Job Matching) */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 20,
                }}
              >
                Rekomendasi Lowongan
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.job_matches.matches.map((job) => (
                  <div
                    key={job.rank}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(248,251,255,0.8)",
                      border: "1px solid rgba(148,163,184,0.16)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #4f80ff 0%, #60c2ff 100%)",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {job.rank}
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}
                      >
                        {job.job_title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#4f80ff",
                        flexShrink: 0,
                      }}
                    >
                      {Math.round(job.combined_score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analisis Skill Gap */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 20,
                }}
              >
                Analisis Skill Gap
              </h3>
              {result.gap_analysis.matched_skills.length === 0 &&
              result.gap_analysis.missing_skills.length === 0 ? (
                <p style={{ fontSize: 14, color: "#94a3b8" }}>
                  Data skill lowongan belum tersedia. Tambahkan file metadata
                  lowongan di backend untuk mengaktifkan analisis ini.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#059669",
                        marginBottom: 10,
                      }}
                    >
                      Skill Dimiliki ({result.gap_analysis.matched_skills.length})
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {result.gap_analysis.matched_skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "rgba(16,185,129,0.12)",
                            color: "#047857",
                            border: "1px solid rgba(16,185,129,0.24)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#dc2626",
                        marginBottom: 10,
                      }}
                    >
                      Skill Kurang ({result.gap_analysis.missing_skills.length})
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {result.gap_analysis.missing_skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "rgba(239,68,68,0.1)",
                            color: "#b91c1c",
                            border: "1px solid rgba(239,68,68,0.24)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rekomendasi Pembelajaran (Learning Path) */}
            {result.learning_recommendations.recommendations.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 32 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 20,
                  }}
                >
                  Rekomendasi Pembelajaran
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.learning_recommendations.recommendations.map((rec) => (
                    <div
                      key={rec.skill}
                      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                    >
                      <CheckCircle2
                        size={20}
                        color="#60c2ff"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#0f172a",
                            textTransform: "capitalize",
                            marginBottom: 2,
                          }}
                        >
                          {rec.skill}
                        </p>
                        {rec.resources.map((r, ri) => (
                          <a
                            key={ri}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "#48658f",
                              textDecoration: "none",
                            }}
                          >
                            {r.title} · {r.provider} ({r.level})
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexDirection: "column",
              }}
            >
              <button
                onClick={handleUploadAnother}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #4f80ff 0%, #60c2ff 100%)",
                  border: "none",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 8px 28px rgba(79,128,255,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Upload CV Lain
              </button>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 28px",
                  borderRadius: 12,
                  background: "rgba(15,23,42,0.05)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#0f172a",
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(15,23,42,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(15,23,42,0.05)";
                }}
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        div[style*="animation"] {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
