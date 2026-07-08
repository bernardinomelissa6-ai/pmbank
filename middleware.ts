import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/setup"];

/**
 * Checagem "otimista": só olha se existe o cookie de sessão do Supabase, sem validar o
 * token. Evita importar @supabase/ssr no Edge Runtime (essa importação puxa o SDK
 * completo, incluindo o cliente de realtime, que quebra o bundle do middleware com
 * "ReferenceError: __dirname is not defined" — bug conhecido do Next.js ao empacotar
 * dependências do supabase-js para o Edge). A validação de verdade acontece nas páginas,
 * via requireProfile()/getCurrentProfile() (lib/auth-guards.ts), que rodam em runtime
 * Node.js normal e chamam supabase.auth.getUser() de verdade.
 */
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasSession = hasSupabaseSessionCookie(request);

  if (!hasSession && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = hasSession ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
