"use client"

import { useState } from "react"
import { StoreSidebar } from "@/components/store-sidebar"
import { StoreTopbar } from "@/components/store-topbar"
import { SiteFooter } from "@/components/site-footer"

export function StoreShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <StoreTopbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
