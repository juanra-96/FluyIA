"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { History, Calendar } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface SearchHistoryItem {
  id: string | null
  query: string | null
  created_at: string
  isContextQuery: boolean
  key: string
}

interface HistoryListProps {
  initialSearches: SearchHistoryItem[]
  activeId?: string
}

export default function HistoryList({ initialSearches, activeId }: HistoryListProps) {
  const [searches, setSearches] = useState<SearchHistoryItem[]>(initialSearches)
  const supabase = createClient()

  useEffect(() => {
    // Sincronizar con props del servidor iniciales
    setSearches(initialSearches)
  }, [initialSearches])

  useEffect(() => {
    // Suscribirse a la tabla de sesiones para actualizaciones instantáneas
    const channel = supabase
      .channel('realtime-sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scraping_searches' },
        (payload) => {
          const newSession = payload.new
          const isLiteral = newSession.search_id?.includes('{{') || false
          const key = (newSession.search_id && !isLiteral) ? newSession.search_id : `q:${newSession.query}`

          setSearches((prev) => {
            if (prev.some(s => s.key === key)) return prev

            const newItem: SearchHistoryItem = {
              id: newSession.search_id,
              query: newSession.query,
              created_at: newSession.created_at,
              isContextQuery: !newSession.search_id || isLiteral,
              key: key
            }

            const updated = [newItem, ...prev].slice(0, 100)
            
            window.dispatchEvent(new CustomEvent('session-added', { 
              detail: { key } 
            }))
            
            return updated
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto px-1 pr-2 custom-scrollbar">
      {searches.length > 0 ? (
        searches.map((s) => (
          <Link 
            key={s.key} 
            href={`/dashboard/scraping?id=${s.key}`}
            className={`flex flex-col p-3 rounded-lg transition-all duration-300 ${activeId === s.key ? 'bg-primary/10 border-l-4 border-primary shadow-sm' : 'hover:bg-muted/50 border-l-4 border-transparent'}`}
          >
            <span className={`text-sm font-bold truncate capitalize ${activeId === s.key ? 'text-primary' : 'text-foreground/80'}`}>
              {s.query || 'Búsqueda sin nombre'}
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                <Calendar className="w-3 h-3 text-primary/40" />
                {new Date(s.created_at).toLocaleDateString()}
              </div>
              {s.isContextQuery && (
                <span className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground font-black italic border border-border/20">OLD</span>
              )}
            </div>
          </Link>
        ))
      ) : (
        <p className="text-xs text-muted-foreground p-4 text-center italic">Sin actividad reciente.</p>
      )}
      {activeId && (
        <Link 
          href="/dashboard/scraping" 
          className="mt-4 text-center text-[11px] text-primary hover:underline font-black uppercase tracking-widest italic"
        >
          Ver todos los leads
        </Link>
      )}
    </div>
  )
}
