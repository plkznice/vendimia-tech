"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Building2, GraduationCap } from "lucide-react";

type Role = "student" | "company";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [career, setCareer] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Crear usuario via API server-side (sin rate limit de Auth)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, name, university, career, industry }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    // Iniciar sesión automáticamente después del registro
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(role === "student" ? "/student/dashboard" : "/company/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="text-slate-500 mt-2">Elegí tu rol para comenzar</p>
        </div>

        {/* Selector de rol */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              role === "student"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <GraduationCap className="h-7 w-7" />
            <span className="text-sm font-semibold">Estudiante</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("company")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              role === "company"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <Building2 className="h-7 w-7" />
            <span className="text-sm font-semibold">Empresa</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {role === "student" ? "Nombre completo" : "Nombre de la empresa"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={role === "student" ? "Juan Pérez" : "Acme Corp"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Universidad</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="UBA, UTN, UADE..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
                <input
                  type="text"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingeniería en Sistemas..."
                />
              </div>
            </>
          )}

          {role === "company" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Industria</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tecnología, Finanzas..."
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-slate-500">
            ¿Ya tenés cuenta?{" "}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
