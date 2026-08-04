import { usuarioActivoSeguro } from "@/lib/portal"
import { busquedaGlobal } from "@/lib/data/busqueda"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return new Response("No autorizado", { status: 401 })

  const q = new URL(req.url).searchParams.get("q") ?? ""
  const resultado = await busquedaGlobal(usuario, q)
  return Response.json(resultado)
}
