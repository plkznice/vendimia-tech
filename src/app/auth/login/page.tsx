"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Building2, GraduationCap } from "lucide-react";

type Role = "student" | "company";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Credenciales incorrectas");
      setLoading(false);
      return;
    }

    // Verificar que el rol coincida
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (userData?.role !== role) {
      setError(`Esta cuenta está registrada como ${userData?.role === "student" ? "estudiante" : "empresa"}`);
      await supabase.auth.signOut();
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
          <h1 className="text-3xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="text-slate-500 mt-2">Seleccioná tu rol</p>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu contraseña"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            Ingresar
          </Button>

          <p className="text-center text-sm text-slate-500">
            ¿No tenés cuenta?{" "}
            <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
              Registrarse
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
