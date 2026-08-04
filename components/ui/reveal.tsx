"use client"

import { motion } from "motion/react"

// Aparición suave (fade + subida) al montar. Para dar vida a dashboards y secciones.
export function Reveal({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Contenedor que aplica stagger a sus hijos directos <Reveal>.
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
