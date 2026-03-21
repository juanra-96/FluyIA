import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Bot, Mic, Zap } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenido, <span className="text-primary">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Aquí tienes el resumen de la actividad de tus agentes de hoy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-200 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Llamadas</CardTitle>
            <Mic className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">+12,234</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium text-emerald-500">+19% desde el mes pasado</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-200 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Flujos n8n</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">573</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium text-emerald-500">+42 activos hoy</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-200 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Consumo API</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1.2M</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Peticiones exitosas</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-200 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Alertas</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium text-amber-500">3 agentes revisión rev. manual</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7 mt-4">
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Últimas Interacciones</CardTitle>
            <CardDescription className="text-sm">
              Tus agentes han manejado 264 consultas en las últimas 24 horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[350px] flex-col items-center justify-center rounded-b-xl bg-muted/20 border-t border-border/40">
            <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground text-center max-w-sm">
              La tabla de logs reales se conectará al webhook de n8n en la siguiente fase.
            </p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Estado del Sistema</CardTitle>
            <CardDescription className="text-sm">Telemetría de la infraestructura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 mt-2">
             <div className="flex items-center p-3 rounded-lg bg-card border border-border/40 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-600 dark:bg-green-400 shadow-[0_0_8px_rgba(22,163,74,0.6)]"></div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">Túnel n8n (Cloudflare)</p>
                  <p className="text-xs text-muted-foreground font-medium">Conectado • Latencia 42ms</p>
                </div>
              </div>
              
             <div className="flex items-center p-3 rounded-lg bg-card border border-border/40 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-600 dark:bg-green-400 shadow-[0_0_8px_rgba(22,163,74,0.6)]"></div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">Base de Datos Supabase</p>
                  <p className="text-xs text-muted-foreground font-medium">Activa • 99.9% Uptime</p>
                </div>
              </div>
              
             <div className="flex items-center p-3 rounded-lg bg-card border border-border/40 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(217,119,6,0.6)]"></div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">Motor de Voz AI</p>
                  <p className="text-xs text-muted-foreground font-medium">Entrenando nuevo modelo...</p>
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
