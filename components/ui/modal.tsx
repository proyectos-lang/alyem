"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Modal ligero controlado por estado. Uso:
// <Modal trigger={<Button>Abrir</Button>} title="...">contenido</Modal>
// Para cerrar desde dentro tras una acción, usa el hook useModalClose().

const CloseCtx = createContext<() => void>(() => {})
export const useModalClose = () => useContext(CloseCtx)

export function Modal({
  trigger,
  title,
  description,
  children,
  className,
}: {
  trigger: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-xl",
              "max-h-[90vh] overflow-y-auto",
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-4 md:p-5">
              <div className="flex flex-col gap-1">
                {title && <h2 className="text-base font-semibold">{title}</h2>}
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 md:p-5">
              <CloseCtx.Provider value={() => setOpen(false)}>{children}</CloseCtx.Provider>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
