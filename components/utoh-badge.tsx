import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react"
import { estadoUtoh } from "@/lib/utoh"

// Insignia de estado del permiso de UTOH (alarma de vencimiento).
export function UtohBadge({ vencimiento }: { vencimiento: string | null | undefined }) {
  const { estado, dias } = estadoUtoh(vencimiento)
  if (!estado || dias == null) return null

  const cfg =
    estado === "vencido"
      ? { Icon: ShieldX, clase: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300", texto: `Vencido hace ${Math.abs(dias)}d` }
      : estado === "por_vencer"
        ? { Icon: ShieldAlert, clase: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300", texto: dias === 0 ? "Vence hoy" : `Vence en ${dias}d` }
        : { Icon: ShieldCheck, clase: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300", texto: "Vigente" }

  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cfg.clase}`}>
      <Icon className="size-3 shrink-0" /> {cfg.texto}
    </span>
  )
}
