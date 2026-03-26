"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Briefcase, Plus, Trash2, X } from "lucide-react";

interface JobPost {
  id: string;
  title: string;
  description: string;
  type: "job" | "internship";
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  job: "Empleo",
  internship: "Pasantía",
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  job: "bg-blue-100 text-blue-700",
  internship: "bg-violet-100 text-violet-700",
};

export default function CompanyJobsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"job" | "internship">("job");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchCompanyAndJobs() {
      setDataLoading(true);

      const { data: companyData } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!companyData) {
        setDataLoading(false);
        return;
      }

      setCompanyId(companyData.id);

      const { data: jobsData } = await supabase
        .from("job_posts")
        .select("id, title, description, type, created_at")
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });

      setJobs((jobsData as JobPost[]) ?? []);
      setDataLoading(false);
    }

    fetchCompanyAndJobs();
  }, [user, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;

    setSubmitting(true);
    setFormError("");

    const { data, error } = await supabase
      .from("job_posts")
      .insert({
        company_id: companyId,
        title: title.trim(),
        description: description.trim(),
        type,
      })
      .select("id, title, description, type, created_at")
      .single();

    if (error || !data) {
      setFormError("Error al publicar la oferta. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }

    setJobs((prev) => [data as JobPost, ...prev]);
    setTitle("");
    setDescription("");
    setType("job");
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(jobId: string) {
    setDeletingId(jobId);

    const { error } = await supabase
      .from("job_posts")
      .delete()
      .eq("id", jobId);

    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }

    setDeletingId(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 text-sm">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/company/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-slate-900">Ofertas laborales</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1.5">
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Nueva oferta
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* New job form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Publicar nueva oferta</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título del puesto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Desarrollador Frontend Jr."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describí las responsabilidades, requisitos y beneficios del puesto..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de oferta <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "job" | "internship")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="job">Empleo</option>
                  <option value="internship">Pasantía</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" isLoading={submitting} size="md">
                  Publicar oferta
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Job list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {jobs.length === 0
              ? "Sin ofertas publicadas"
              : `${jobs.length} oferta${jobs.length !== 1 ? "s" : ""} publicada${jobs.length !== 1 ? "s" : ""}`}
          </h2>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Todavía no publicaste ninguna oferta.</p>
              <p className="text-slate-400 text-sm mt-1">
                Hacé clic en{" "}
                <span className="font-medium text-blue-600">Nueva oferta</span> para empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            TYPE_BADGE_STYLES[job.type] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {TYPE_LABELS[job.type] ?? job.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1.5 line-clamp-2">{job.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(job.created_at)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      isLoading={deletingId === job.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      aria-label="Eliminar oferta"
                    >
                      {deletingId !== job.id && <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
