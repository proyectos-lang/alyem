"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal, useModalClose } from "@/components/ui/modal"
import { importarAduanas } from "@/lib/actions/aduanas"

export function ImportarAduanas() {
  return (
    <Modal
      title="Importar aduanas (Excel/CSV)"
      description="El archivo debe tener columnas 'nombre' y 'codigo'."
      trigger={
        <Button variant="outline">
          <Upload /> Importar Excel/CSV
        </Button>
      }
    >
      <FormImport />
    </Modal>
  )
}

function FormImport() {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const r = await importarAduanas(fd)
        close()
        router.refresh()
        // La cifra se ve en la tabla ya actualizada.
        void r
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Archivo</Label>
        <Input name="archivo" type="file" accept=".xlsx,.xls,.csv" required />
        <p className="text-xs text-muted-foreground">
          Se agregan o actualizan por código. Columnas aceptadas: nombre / código.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Importando…" : "Importar"}
        </Button>
      </div>
    </form>
  )
}
