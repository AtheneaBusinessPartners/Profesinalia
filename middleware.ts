import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isSuperadminRoute = request.nextUrl.pathname.startsWith("/superadmin");

  if (isDashboardRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (isSuperadminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/superadmin/:path*"],
};
