import { redirect } from "next/navigation"
import { getUsuarioActivo } from "@/lib/session"
import { inicioPara } from "@/lib/nav"
import { SetupNotice } from "@/components/setup-notice"

export const dynamic = "force-dynamic"

export default async function Home() {
  let usuario
  try {
    usuario = await getUsuarioActivo()
  } catch (e) {
    return <SetupNotice mensaje={(e as Error).message} />
  }
  if (!usuario) redirect("/login")
  redirect(inicioPara(usuario.rol))
}
