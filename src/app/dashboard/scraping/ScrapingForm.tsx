"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function ScrapingForm() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const supabase = createClient()

  // Escuchar el evento de que la sesión se añadió al historial
  useEffect(() => {
    if (!loading || !activeSessionId) return

    const handleSessionAdded = (e: any) => {
      if (e.detail.key === activeSessionId) {
        setLoading(false)
        setActiveSessionId(null)
      }
    }

    window.addEventListener('session-added', handleSessionAdded as any)

    // Fallback: máximo 15 segundos esperando
    const timer = setTimeout(() => {
      setLoading(false)
      setActiveSessionId(null)
    }, 15000)

    return () => {
      window.removeEventListener('session-added', handleSessionAdded as any)
      clearTimeout(timer)
    }
  }, [loading, activeSessionId, supabase])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setStatus({ type: null, msg: '' })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          userId: user?.id 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ type: 'success', msg: 'Agente lanzado. Redirigiendo a la sesión...' })
        setActiveSessionId(data.searchId)
        setQuery("")
        
        // Redirigir a la nueva sesión
        router.push(`/dashboard/scraping?id=${data.searchId}`)
      } else {
        throw new Error(data.error || 'Error al iniciar scraping')
      }
    } catch (err: any) {
      setLoading(false)
      setStatus({ type: 'error', msg: err.message })
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Mecánicos en Madrid..." 
              className="pl-10 h-11 text-sm bg-background"
              disabled={loading}
            />
          </div>
          <Button disabled={loading} type="submit" className="w-full h-11 shadow-sm font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "Procesando..." : "Lanzar Agente"}
          </Button>
        </div>
      </form>
      {status.msg && (
        <p className={`text-xs mt-1 animate-in slide-in-from-top-1 ${status.type === 'success' ? 'text-green-500 font-medium' : 'text-red-500'}`}>
          {status.msg}
        </p>
      )}
    </div>
  )
}
