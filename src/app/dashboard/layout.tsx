import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Protect the route
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <AppSidebar />
        <main className="flex flex-1 flex-col w-full overflow-hidden">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 shadow-sm">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-2 hover:bg-muted p-2 rounded-md transition-colors" />
                <div className="h-4 w-px bg-border max-sm:hidden" />
                <h1 className="text-sm font-medium tracking-wide text-foreground/80">Espacio de Trabajo</h1>
            </div>
            </header>
            <div className="flex-1 overflow-auto p-6 md:p-8">
            {children}
            </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
