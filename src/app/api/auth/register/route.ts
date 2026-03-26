import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, password, role, name, university, career, industry } = await request.json();

  if (!email || !password || !role || !name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Crear usuario con admin (sin rate limit)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Error al crear usuario" }, { status: 400 });
  }

  const userId = data.user.id;

  // Insertar en users
  const { error: userError } = await supabase
    .from("users")
    .insert({ id: userId, email, role });

  if (userError) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  // Insertar perfil según rol
  if (role === "student") {
    await supabase.from("students").insert({ user_id: userId, name, university, career });
  } else {
    await supabase.from("companies").insert({ user_id: userId, name, industry });
  }

  return NextResponse.json({ success: true });
}
