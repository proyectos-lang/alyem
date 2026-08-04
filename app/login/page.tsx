import { redirect } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"
import { SetupNotice } from "@/components/setup-notice"
import { getUsuarioActivo } from "@/lib/session"
import { inicioPara } from "@/lib/nav"

export const dynamic = "force-dynamic"

const BULLETS = [
  "Programa operaciones logísticas",
  "Realiza trazabilidad en tiempo real de tus operaciones",
  "Control documental en la nube",
  "Indicadores y reportes gerenciales",
]

export default async function LoginPage() {
  let usuario
  try {
    usuario = await getUsuarioActivo()
  } catch (e) {
    return <SetupNotice mensaje={(e as Error).message} />
  }
  if (usuario) redirect(inicioPara(usuario.rol))

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca (escritorio) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#57585a] via-[#3a3b3d] to-[#242527] p-12 text-white lg:flex">
        {/* Glows decorativos */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#f48029]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-[#f48029]/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex rounded-xl bg-white/95 px-3 py-2 shadow-lg">
            <Logo size="md" />
          </div>
        </div>

        <div className="relative flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-semibold leading-tight">Sistema de Gestión de Operaciones Logísticas B2B</h1>
            <p className="mt-3 max-w-md text-white/70">La agencia y sus clientes, conectados en tiempo real de principio a fin del proceso.</p>
          </div>
          <ul className="flex flex-col gap-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f48029]/20 text-[#f7a25a]">
                  <CheckCircle2 className="size-4" />
                </span>
                <span className="text-white/85">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Alyem Customs · Plataforma de seguimiento aduanero</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
        <LoginForm />
      </div>
    </div>
  )
}
