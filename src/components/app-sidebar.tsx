"use client"

import { Home, Mic, Bot, Settings, Users, ArrowUpRight, Search } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthButton } from "./AuthButton"

const items = [
  { title: "Panorámica", url: "/dashboard", icon: Home },
  { title: "Buscador Leads (n8n)", url: "/dashboard/scraping", icon: Search },
  { title: "Agentes de Voz", url: "/dashboard/agents", icon: Mic },
  { title: "Flujos n8n", url: "/dashboard/workflows", icon: Bot },
  { title: "Clientes", url: "/dashboard/users", icon: Users },
  { title: "Configuración", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname();
  
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 font-bold text-xl px-1">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground shadow-sm flex items-center justify-center">
            <span className="text-sm font-extrabold leading-none">F</span>
          </div>
          <span className="tracking-tight">FluyIA</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      className={`h-10 transition-all ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 w-full">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-border/50 p-4">
        <AuthButton />
      </SidebarFooter>
    </Sidebar>
  )
}
