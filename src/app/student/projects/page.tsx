"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { useAuth } from "@/context/AuthContext";
import { useXO } from "@/context/XOProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/escrow";
import { ArrowLeft, Coins, ExternalLink, Zap, CheckCircle, PackageCheck } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  amount_rbtc: number;
  deadline_days: number;
  tx_hash: string | null;
  contract_project_id: number | null;
  status: string;
  companies: { name: string } | null;
}

interface MatchResult {
  score: number;
  reason: string;
}

export default function StudentProjectsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { getSigner, isConnected } = useXO();
  const supabase = useMemo(() => createClient(), []);

  const [openProjects, setOpenProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<{ name?: string; institution?: string; year?: number; pdf_url?: string }[]>([]);
  const [matches, setMatches] = useState<Record<number, MatchResult>>({});
  const [matchingId, setMatchingId] = useState<number | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [delivering, setDelivering] = useState<number | null>(null);
  const [deliverError, setDeliverError] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setDataLoading(true);

      const { data: studentData } = await supabase
        .from("students").select("id").eq("user_id", user!.id).single();

      if (studentData) {
        setStudentId(studentData.id);

        const { data: certs } = await supabase
          .from("certificates").select("name, institution, year, pdf_url").eq("student_id", studentData.id);
        setCertificates(certs ?? []);

        const { data: myApps } = await supabase
          .from("applications").select("project_id").eq("student_id", studentData.id);
        if (myApps) setApplied(new Set(myApps.map((a) => a.project_id)));

        // Proyectos activos asignados al estudiante
        const { data: myAppsAccepted } = await supabase
          .from("applications")
          .select("project_id, projects(id, title, description, amount_rbtc, deadline_days, tx_hash, contract_project_id, status, companies(name))")
          .eq("student_id", studentData.id)
          .eq("status", "accepted");

        if (myAppsAccepted) {
          const active = myAppsAccepted
            .map((a) => a.projects as unknown as Project)
            .filter((p) => p && (p.status === "active" || p.status === "delivered"));
          setActiveProjects(active);
        }
      }

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, title, description, amount_rbtc, deadline_days, tx_hash, contract_project_id, status, companies(name)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      setOpenProjects((projectsData as unknown as Project[]) ?? []);
      setDataLoading(false);
    }

    fetchData();
  }, [user, supabase]);

  async function handleMatch(project: Project) {
    setMatchingId(project.id);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectDescription: project.description, certificates }),
      });
      const data: MatchResult = await res.json();
      setMatches((prev) => ({ ...prev, [project.id]: data }));
    } finally {
      setMatchingId(null);
    }
  }

  async function handleApply(project: Project) {
    if (!studentId) return;
    setApplying(project.id);

    const match = matches[project.id];
    await supabase.from("applications").insert({
      project_id: project.id,
      student_id: studentId,
      match_score: match?.score ?? null,
      match_reason: match?.reason ?? null,
      status: "pending",
    });

    setApplied((prev) => new Set([...prev, project.id]));
    setApplying(null);
  }

  async function handleDeliver(project: Project) {
    if (project.status === "delivered") return;
    setDelivering(project.id);
    setDeliverError((prev) => ({ ...prev, [project.id]: "" }));

    // Llamar al contrato si está disponible
    if (isConnected && project.contract_project_id !== null) {
      try {
        const signer = await getSigner();
        const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
        const tx = await contract.deliverWork(project.contract_project_id);
        await tx.wait();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        if (!msg.includes("user rejected")) {
          console.error("Error en contrato deliverWork:", err);
          // Continuar igual — actualizamos DB
        } else {
          setDeliverError((prev) => ({ ...prev, [project.id]: "Transacción rechazada." }));
          setDelivering(null);
          return;
        }
      }
    }

    // Actualizar estado en DB
    await supabase.from("projects").update({ status: "delivered" }).eq("id", project.id);
    setActiveProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: "delivered" } : p));
    setDelivering(null);
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/student/dashboard" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Coins className="h-5 w-5 text-orange-500" />
          <span className="font-bold text-slate-900">Mis proyectos</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Proyectos activos asignados */}
        {activeProjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Proyectos asignados</h2>
            <div className="space-y-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl border border-blue-200 p-5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{project.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      project.status === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>{project.status === "delivered" ? "Entregado" : "Activo"}</span>
                  </div>
                  <p className="text-xs text-slate-400">{project.companies?.name}</p>
                  <p className="text-sm font-medium text-orange-600 mt-1">{project.amount_rbtc} tRBTC</p>

                  {project.tx_hash && (
                    <a href={`https://explorer.testnet.rsk.co/tx/${project.tx_hash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />Ver escrow en RSK
                    </a>
                  )}

                  {deliverError[project.id] && (
                    <p className="text-xs text-red-600 mt-2">{deliverError[project.id]}</p>
                  )}

                  {project.status === "active" ? (
                    <Button
                      size="sm"
                      onClick={() => handleDeliver(project)}
                      isLoading={delivering === project.id}
                      className="mt-4 bg-green-600 hover:bg-green-700 gap-1.5"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Marcar como entregado
                    </Button>
                  ) : (
                    <p className="mt-4 text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />Trabajo entregado — esperando aprobación de la empresa
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proyectos abiertos */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Proyectos disponibles</h2>
          {openProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Coins className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay proyectos disponibles por ahora.</p>
            </div>
          ) : (
            openProjects.map((project) => {
              const match = matches[project.id];
              const isApplied = applied.has(project.id);

              return (
                <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
                  <h3 className="font-semibold text-slate-900">{project.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{project.companies?.name}</p>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-3">{project.description}</p>
                  <p className="text-sm font-medium text-orange-600 mt-2">{project.amount_rbtc} tRBTC · {project.deadline_days} días</p>

                  {project.tx_hash && (
                    <a href={`https://explorer.testnet.rsk.co/tx/${project.tx_hash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />Ver escrow en RSK
                    </a>
                  )}

                  {match && (
                    <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                      <p className="text-sm font-semibold text-violet-700">Match: {match.score}/100</p>
                      <p className="text-xs text-violet-600 mt-0.5">{match.reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {!match && (
                      <Button size="sm" variant="secondary" onClick={() => handleMatch(project)}
                        isLoading={matchingId === project.id} className="gap-1.5">
                        <Zap className="h-3.5 w-3.5" />Ver mi match
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleApply(project)}
                      isLoading={applying === project.id}
                      disabled={isApplied}
                      className={isApplied ? "opacity-50 cursor-not-allowed" : ""}>
                      {isApplied ? "Postulado" : "Postularme"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
