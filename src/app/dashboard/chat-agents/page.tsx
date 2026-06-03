"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Plus, Bot, ArrowRight, Loader2, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        await fetchAgents(session.user.id);
      } else {
        setLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        fetchAgents(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAgents([]);
        setUserId(null);
        setLoading(false);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    }
  }, [])

  async function fetchAgents(id: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from("chat_agents")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching agents:", error)
    } else if (data) {
      setAgents(data)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if(!confirm("¿Seguro que deseas eliminar este agente? Se borrarán sus documentos también.")) return;
    await supabase.from("chat_agents").delete().eq("id", id);
    if (userId) fetchAgents(userId);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes de Chat</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus IA personalizadas con contexto específico (RAG).</p>
        </div>
        <Link href="/dashboard/chat-agents/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Crear Agente
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Bot className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tienes agentes creados</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Comienza creando un agente de chat y proporciónale documentos para que aprenda el contexto de tu negocio.
          </p>
          <Link href="/dashboard/chat-agents/nuevo">
            <Button>Crear mi primer agente</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="border bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                    <Bot className="w-6 h-6" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold mb-1 truncate" title={agent.name}>{agent.name}</h3>
                <p className="text-sm font-medium text-primary mb-3">Rol: {agent.role}</p>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{agent.personality}</p>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary/50 text-secondary-foreground">
                  {agent.model}
                </div>
              </div>
              <div className="p-4 border-t bg-muted/20">
                <Link href={`/dashboard/chat-agents/${agent.id}`}>
                  <Button variant="ghost" className="w-full justify-between group">
                    <span>Editar y Probar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
