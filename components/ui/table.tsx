import { cn } from "@/lib/utils"

// `maxHeight` acota la altura de la tabla: al superarla, la tabla hace scroll
// vertical interno (evita que crezca sin fin) y el encabezado queda fijo (sticky).
function Table({
  className,
  maxHeight = "70vh",
  ...props
}: React.ComponentProps<"table"> & { maxHeight?: string }) {
  return (
    // En impresión se expande completa (sin tope de alto ni scroll).
    <div className="relative w-full overflow-auto print:overflow-visible print:!max-h-none" style={{ maxHeight }}>
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

// Encabezado fijo (sticky) al hacer scroll vertical dentro del contenedor.
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("sticky top-0 z-10 print:static [&_tr]:border-b [&_tr]:border-border [&_tr]:bg-muted", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-border transition-colors hover:bg-muted/50", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-xs font-medium text-muted-foreground whitespace-nowrap",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
