import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas públicas (sin sesión): login y enlace público de seguimiento.
const PUBLICAS = ["/login", "/track"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }
  // Requiere sesión (cookie). La validación real del usuario ocurre en el servidor.
  if (!req.cookies.get("demo_user_id")) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  // Excluye assets estáticos e internos de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
}
