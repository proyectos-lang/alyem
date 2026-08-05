import { ejecutarEscalamientoSla, generarResumenDiario } from "@/lib/data/tareas"

export const dynamic = "force-dynamic"

// Tareas diarias automáticas (Vercel Cron). Protegido por CRON_SECRET:
// Vercel envía "Authorization: Bearer <CRON_SECRET>" en cada invocación.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return new Response("Falta configurar CRON_SECRET", { status: 500 })
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("No autorizado", { status: 401 })

  const [sla, resumen] = await Promise.all([ejecutarEscalamientoSla(), generarResumenDiario()])
  return Response.json({ ok: true, escalamientoSla: sla, resumen })
}
