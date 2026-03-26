import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Rutas protegidas — redirigir a login si no hay sesión
  if ((pathname.startsWith("/student") || pathname.startsWith("/company")) && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Si hay sesión, verificar que el rol coincida con la ruta
  if (user && (pathname.startsWith("/student") || pathname.startsWith("/company"))) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = data?.role;

    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/company/dashboard", request.url));
    }
    if (pathname.startsWith("/company") && role !== "company") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  }

  // Redirigir a login si accede a /auth/* y ya tiene sesión
  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = data?.role;
    const dest = role === "company" ? "/company/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/student/:path*", "/company/:path*", "/auth/login", "/auth/register"],
};
