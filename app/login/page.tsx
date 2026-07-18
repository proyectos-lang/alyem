import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { SetupNotice } from "@/components/setup-notice"
import { getUsuarioActivo } from "@/lib/session"
import { getConfig } from "@/lib/config"
import { inicioPara } from "@/lib/nav"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  // Si ya hay sesión, ir al portal correspondiente.
  let usuario
  try {
    usuario = await getUsuarioActivo()
  } catch (e) {
    return <SetupNotice mensaje={(e as Error).message} />
  }
  if (usuario) redirect(inicioPara(usuario.rol))

  const agencia = (await getConfig("agencia_nombre")) ?? "Agencia Aduanera"

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <LoginForm agencia={agencia} />
    </div>
  )
}
