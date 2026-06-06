import Link from "next/link";
import {
  ArrowRight,
  PlayCircle,
  Brain,
  FileText,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              S
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              SkillBridge
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-blue-600">
              Features
            </a>

            <a href="#how-it-works" className="text-slate-600 hover:text-blue-600">
              How It Works
            </a>

            <a href="#about" className="text-slate-600 hover:text-blue-600">
              About
            </a>
          </div>

          <Link
            href="/upload"
            className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Upload CV
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2">

          {/* Left */}
          <div className="flex flex-col justify-center">

            <span className="mb-5 w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              AI-Powered Career Recommendation
            </span>

            <h1 className="text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
              Bridge Your Skills
              <br />
              To Your
              <span className="text-blue-600"> Dream Career</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Upload your CV and receive personalized career recommendations,
              skill gap analysis, and learning paths powered by Artificial
              Intelligence.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/upload"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Upload CV
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/demo"
                className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                <PlayCircle size={20} />
                Lihat Demo
              </Link>
            </div>

            <div className="mt-12 flex gap-10">
              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  123K+
                </h3>

                <p className="text-slate-500">
                  Job Market Data
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900">
                  2.4K+
                </h3>

                <p className="text-slate-500">
                  Resume Dataset
                </p>
              </div>
            </div>
          </div>

          {/* Right Dashboard Preview */}
          <div className="flex items-center justify-center">

            <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl">

              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  AI Analysis Result
                </h3>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  Match 87%
                </span>
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  Recommended Career
                </p>

                <div className="mt-2 rounded-xl bg-blue-50 p-4">
                  <p className="font-semibold text-blue-700">
                    Data Analyst
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  Missing Skills
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-600">
                    Docker
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-600">
                    AWS
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-600">
                    Kubernetes
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm text-slate-500">
                  Learning Path
                </p>

                <div className="space-y-2">

                  <div className="rounded-lg bg-slate-100 p-3">
                    Learn Docker Fundamentals
                  </div>

                  <div className="rounded-lg bg-slate-100 p-3">
                    AWS Cloud Practitioner
                  </div>

                  <div className="rounded-lg bg-slate-100 p-3">
                    Kubernetes Basics
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-center text-4xl font-bold text-slate-900">
            How It Works
          </h2>

          <p className="mt-4 text-center text-slate-600">
            Get your career recommendation in three simple steps.
          </p>

          <div className="mt-16 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border bg-slate-50 p-8">
              <FileText className="mb-4 text-blue-600" size={40} />

              <h3 className="text-xl font-semibold">
                Upload CV
              </h3>

              <p className="mt-3 text-slate-600">
                Upload your PDF or DOCX resume securely.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-8">
              <Brain className="mb-4 text-blue-600" size={40} />

              <h3 className="text-xl font-semibold">
                AI Analysis
              </h3>

              <p className="mt-3 text-slate-600">
                AI extracts skills, education, and experience from your CV.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-8">
              <GraduationCap className="mb-4 text-blue-600" size={40} />

              <h3 className="text-xl font-semibold">
                Get Learning Path
              </h3>

              <p className="mt-3 text-slate-600">
                Receive personalized career recommendations and learning plans.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-24"
      >
        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-center text-4xl font-bold text-slate-900">
            Features
          </h2>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white p-6 shadow">
              <Brain className="mb-4 text-blue-600" />
              <h3 className="font-semibold">
                Resume Parser
              </h3>
              <p className="mt-2 text-slate-600">
                Extract skills automatically using NLP.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <Briefcase className="mb-4 text-blue-600" />
              <h3 className="font-semibold">
                Career Matching
              </h3>
              <p className="mt-2 text-slate-600">
                Discover the most suitable career path.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <FileText className="mb-4 text-blue-600" />
              <h3 className="font-semibold">
                Skill Gap Analysis
              </h3>
              <p className="mt-2 text-slate-600">
                Identify missing industry-required skills.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <GraduationCap className="mb-4 text-blue-600" />
              <h3 className="font-semibold">
                Learning Path
              </h3>
              <p className="mt-2 text-slate-600">
                Get recommended courses and learning steps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">

          <h2 className="text-4xl font-bold text-white">
            Ready To Discover Your Career Path?
          </h2>

          <p className="mt-4 text-blue-100">
            Upload your CV today and let AI guide your future.
          </p>

          <Link
            href="/upload"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-blue-600"
          >
            Start Analysis
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-slate-500">
          © 2026 SkillBridge. AI-Driven Career Path & Gap Analysis.
        </div>
      </footer>

    </main>
  );
}