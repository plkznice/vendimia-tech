"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, GraduationCap, Search, ExternalLink, Award, X } from "lucide-react";

interface CertifiedStudent {
  id: string;
  name: string;
  university: string;
  career: string;
  certificateCount: number;
  latestTxHash: string | null;
  latestChain: string | null;
}

export default function CompanyStudentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<CertifiedStudent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [universityFilter, setUniversityFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchCertifiedStudents() {
      setDataLoading(true);

      // Fetch all certificates joined with student info
      const { data: certsData } = await supabase
        .from("certificates")
        .select(
          "student_id, tx_hash, chain, created_at, students(id, name, university, career)"
        )
        .order("created_at", { ascending: false });

      if (!certsData || certsData.length === 0) {
        setStudents([]);
        setDataLoading(false);
        return;
      }

      // Group certificates by student_id
      const studentMap = new Map<
        string,
        {
          studentData: { id: string; name: string; university: string; career: string };
          count: number;
          latestTxHash: string | null;
          latestChain: string | null;
        }
      >();

      for (const cert of certsData) {
        const studentInfo = cert.students as unknown as {
          id: string;
          name: string;
          university: string;
          career: string;
        } | null;

        if (!studentInfo) continue;

        const existing = studentMap.get(cert.student_id);
        if (existing) {
          existing.count += 1;
          // Already sorted by created_at desc, first occurrence = latest
        } else {
          studentMap.set(cert.student_id, {
            studentData: studentInfo,
            count: 1,
            latestTxHash: cert.tx_hash ?? null,
            latestChain: cert.chain ?? null,
          });
        }
      }

      const result: CertifiedStudent[] = Array.from(studentMap.values()).map(
        ({ studentData, count, latestTxHash, latestChain }) => ({
          id: studentData.id,
          name: studentData.name,
          university: studentData.university,
          career: studentData.career,
          certificateCount: count,
          latestTxHash,
          latestChain,
        })
      );

      setStudents(result);
      setDataLoading(false);
    }

    fetchCertifiedStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = students.filter((s) => {
    const uniQuery = universityFilter.trim().toLowerCase();
    const careerQuery = careerFilter.trim().toLowerCase();
    return (
      (uniQuery === "" || s.university.toLowerCase().includes(uniQuery)) &&
      (careerQuery === "" || s.career.toLowerCase().includes(careerQuery))
    );
  });

  function clearFilters() {
    setUniversityFilter("");
    setCareerFilter("");
  }

  function getEtherscanUrl(txHash: string) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 text-sm">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasActiveFilters = universityFilter.trim() !== "" || careerFilter.trim() !== "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/company/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-slate-900">Estudiantes certificados</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Filtrar estudiantes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Universidad</label>
              <input
                type="text"
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                placeholder="Ej: UTN, UBA..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Carrera</label>
              <input
                type="text"
                value={careerFilter}
                onChange={(e) => setCareerFilter(e.target.value)}
                placeholder="Ej: Sistemas, Contador..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-slate-500"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} estudiante${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
        </p>

        {/* Student list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            {students.length === 0 ? (
              <>
                <p className="text-slate-500 font-medium">No hay estudiantes certificados aún.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Los estudiantes aparecerán aquí cuando reciban su primer certificado NFT.
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-500 font-medium">No se encontraron resultados.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Probá con otros filtros o{" "}
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    limpiá los filtros
                  </button>
                  .
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{student.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{student.career}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="text-slate-400 text-xs">Universidad:</span>
                    <span className="truncate">{student.university}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">
                      {student.certificateCount} certificado{student.certificateCount !== 1 ? "s" : ""} NFT
                    </span>
                  </div>
                </div>

                {/* Etherscan link */}
                {student.latestTxHash && (
                  <a
                    href={getEtherscanUrl(student.latestTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver en Etherscan
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
