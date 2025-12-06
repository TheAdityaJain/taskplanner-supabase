"use client"

import type React from "react"
import { CheckSquare } from "lucide-react"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "Today", href: "/dashboard/today" },
  { name: "All Tasks", href: "/dashboard/tasks" },
  { name: "Leads", href: "/dashboard/leads" },
  { name: "Applications", href: "/dashboard/applications" },
]

const secondaryNav = [{ name: "Settings", href: "/dashboard/settings" }]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-lg tracking-tight">TaskFlow</span>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
