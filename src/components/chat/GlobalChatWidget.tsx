"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { MessageCircle, X, Send, User, Bot, Loader2, Sparkles, ChevronLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function GlobalChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const [inputMsg, setInputMsg] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && isOpen) {
      fetchAgents()
    }
  }, [user, isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  async function fetchAgents() {
    setLoading(true)
    const { data, error } = await supabase
      .from("chat_agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      setAgents(data)
    }
    setLoading(false)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputMsg.trim() || !selectedAgent) return

    const userMsg = inputMsg.trim()
    const newMessages = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)
    setInputMsg("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          agentId: selectedAgent.id,
          history: messages
        })
      })

      if (!res.ok) throw new Error("Error en la respuesta")
      if (!res.body) throw new Error("Cuerpo de respuesta vacío")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantMsg += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content = assistantMsg
          return updated
        })
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error procesando tu mensaje." }])
    } finally {
      setIsTyping(false)
    }
  }

  const resetChat = () => {
    setSelectedAgent(null)
    setMessages([])
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 p-0 m-0">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              {selectedAgent && (
                <button onClick={resetChat} className="p-1 hover:bg-white/10 rounded-full transition-colors mr-1">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="font-bold text-sm leading-tight">
                  {selectedAgent ? selectedAgent.name : "Mis Agentes"}
                </h3>
                <p className="text-[10px] opacity-80 uppercase tracking-wider">
                  {selectedAgent ? selectedAgent.role : "Soporte Inteligente"}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-muted/20">
            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Inicia Sesión</h4>
                  <p className="text-sm text-muted-foreground mt-1">Debes iniciar sesión para acceder a tus agentes y conversar con ellos.</p>
                </div>
                <Link 
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Ir al Dashboard
                </Link>
              </div>
            ) : !selectedAgent ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Cargando agentes...</span>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
                    <Bot className="w-12 h-12 text-muted/30" />
                    <p className="text-sm text-muted-foreground">Aún no tienes agentes creados.</p>
                    <Link 
                      href="/dashboard/chat-agents"
                      onClick={() => setIsOpen(false)}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Crear mi primer agente
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase px-1 mb-2 tracking-wider">Selecciona un agente</p>
                    {agents.map(ag => (
                      <button 
                        key={ag.id}
                        onClick={() => setSelectedAgent(ag)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{ag.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{ag.role}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Messages Panel */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 gap-3 opacity-60">
                      <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs max-w-[200px]">Hola, soy <b>{selectedAgent.name}</b>. Mi especialidad es <b>{selectedAgent.role}</b>. ¿En qué puedo ayudarte hoy?</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"}`}>
                          {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none text-foreground"}`}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 items-center text-muted-foreground bg-card border px-3 py-2 rounded-2xl">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px]">Pensando...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-background border-t">
                  <div className="relative group">
                    <Input 
                      placeholder="Escribe un mensaje..."
                      className="pr-12 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-xl text-xs"
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                    />
                    <Button 
                      size="icon" 
                      type="submit"
                      disabled={!inputMsg.trim() || isTyping}
                      className="absolute right-1 top-1 h-9 w-9 rounded-lg hover:scale-105 transition-transform"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl shadow-primary/20 hover:scale-105 transition-all duration-300 p-0 ${isOpen ? "bg-destructive hover:bg-destructive" : ""}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  )
}
