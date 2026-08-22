import { Ship } from "lucide-react"

// Pantalla amable cuando falta configurar Supabase (env o seed).
export function SetupNotice({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Ship className="size-5" />
          </span>
          <h1 className="text-lg font-semibold">Configuración pendiente</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{mensaje}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Crea un proyecto en Supabase.</li>
          <li>
            Copia <code className="rounded bg-muted px-1">.env.example</code> a{" "}
            <code className="rounded bg-muted px-1">.env.local</code> y coloca la URL y el service role key.
          </li>
          <li>
            Ejecuta <code className="rounded bg-muted px-1">supabase/01-schema.sql</code> y luego{" "}
            <code className="rounded bg-muted px-1">supabase/02-seed.sql</code> en el SQL Editor.
          </li>
          <li>Crea un bucket privado llamado <code className="rounded bg-muted px-1">adjuntos</code>.</li>
          <li>Reinicia el servidor de desarrollo.</li>
        </ol>
      </div>
    </div>
  )
}
