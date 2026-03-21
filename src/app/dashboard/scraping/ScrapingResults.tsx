"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Search as SearchIcon, 
  ChevronLeft, 
  ChevronRight,
  Globe,
  MapPin,
  Phone,
  Star,
  ExternalLink,
  Table as TableIcon,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  Calendar,
  X
} from "lucide-react"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/client"
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Lead {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  web: string | null
  rating: number | null
  reviews: number | null
  tipo: string | null
  created_at: string
  search_id: string | null
  query: string | null
}

interface ScrapingResultsProps {
  initialLeads: Lead[]
  activeSearchId?: string
  activeSearchRaw?: any
}

export default function ScrapingResults({ initialLeads, activeSearchId, activeSearchRaw }: ScrapingResultsProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filter, setFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLive, setIsLive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemsPerPage = 8
  const supabase = createClient()

  // Sincronizar leads y mostrar modal si es una sesión nueva sin leads
  useEffect(() => {
    setMounted(true)
    setLeads(initialLeads)
    setCurrentPage(1)
    
    if (activeSearchId && initialLeads.length === 0) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [initialLeads, activeSearchId])

  // Realtime
  useEffect(() => {
    setIsLive(true)
    const channel = supabase
      .channel('realtime-leads-final')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scraped_leads' },
        (payload) => {
          const newLead = payload.new as Lead
          let shouldAdd = false
          
          if (!activeSearchId) {
            shouldAdd = true
          } else if (activeSearchId.startsWith('q:')) {
            shouldAdd = newLead.query === activeSearchId.replace('q:', '')
          } else if (newLead.search_id === activeSearchId) {
            shouldAdd = true
          }

          if (shouldAdd) {
            setLeads((prev) => {
              if (prev.some(l => l.id === newLead.id)) return prev
              return [newLead, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, activeSearchId])

  // Título dinámico
  const currentQuery = activeSearchRaw?.query || leads[0]?.query || "Iniciando..."
  const currentCreatedAt = activeSearchRaw?.created_at || leads[leads.length - 1]?.created_at
  const isLegacy = activeSearchRaw?.isContextQuery || (activeSearchId?.startsWith('q:'))

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const searchStr = `${lead.nombre} ${lead.direccion} ${lead.telefono} ${lead.tipo}`.toLowerCase()
      return searchStr.includes(filter.toLowerCase())
    })
  }, [leads, filter])

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLeads.slice(start, start + itemsPerPage)
  }, [filteredLeads, currentPage])

  const exportCSV = () => {
    const dataToExport = filteredLeads.map(l => ({
      Nombre: l.nombre,
      Categoria: l.tipo,
      Direccion: l.direccion,
      Telefono: l.telefono,
      Web: l.web,
      Rating: l.rating,
      Reviews: l.reviews,
      Fecha: new Date(l.created_at).toLocaleDateString()
    }))
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const csvContent = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `Leads_FluyIA_${new Date().toISOString().split('T')[0]}.csv`; link.click()
  }

  const exportXLSX = () => {
    const dataToExport = filteredLeads.map(l => ({
      Nombre: l.nombre,
      Categoria: l.tipo,
      Direccion: l.direccion,
      Telefono: l.telefono,
      Web: l.web,
      Rating: l.rating,
      Reviews: l.reviews,
      Fecha: new Date(l.created_at).toLocaleDateString()
    }))
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads")
    XLSX.writeFile(workbook, `Leads_FluyIA_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="flex flex-col gap-6 relative" suppressHydrationWarning>
      {/* Modal Personalizado (Custom Modal) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card border border-primary/20 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-4 italic">¡Agente en Marcha!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Tu búsqueda de leads ha comenzado con éxito en <span className="text-primary font-bold">n8n</span>. 
              Los resultados aparecerán automáticamente en esta pantalla conforme se procesen.
            </p>
            <Button onClick={() => setShowModal(false)} className="w-full font-black py-6 text-lg shadow-lg hover:shadow-primary/20 transition-all">
              ¡Entendido!
            </Button>
          </div>
        </div>
      )}

      {/* Título reactivo */}
      <div className="border-b border-border/40 pb-8 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-4xl font-black tracking-tight mb-2 uppercase italic text-foreground/90 leading-none">
              {activeSearchId 
                ? (currentQuery === "Iniciando..." ? 'Buscando Leads...' : `Resultados: ${currentQuery}`)
                : 'Historial Global'}
            </CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground/80">
              {activeSearchId 
                ? (isLegacy 
                    ? `Vista de leads pasados vinculados al texto: "${currentQuery}"` 
                    : `Sesión inteligente iniciada ${currentCreatedAt && mounted ? `el ${new Date(currentCreatedAt).toLocaleString()}` : (currentCreatedAt ? '...' : 'hace un momento')}.`)
                : `Visualización sincronizada de los últimos prospectos detectados.`}
            </CardDescription>
          </div>
          {activeSearchId && (
              <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-full border border-primary/20 shadow-sm flex items-center gap-2 tracking-widest uppercase italic">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  {isLegacy ? 'DATOS LEGACY' : 'SESIÓN ACTIVA'}
              </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-96 shadow-sm rounded-lg overflow-hidden border border-border/50">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Filtrar por nombre, dirección o tipo..."
                    value={filter}
                    onChange={(e) => {setFilter(e.target.value); setCurrentPage(1)}}
                    className="pl-10 h-11 border-none bg-background/50 focus-visible:ring-primary/20"
                />
            </div>
            {isLive && (
                <div className="flex items-center gap-2 text-[10px] text-primary font-black px-1 uppercase tracking-widest italic animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    AGENTE CONECTADO • RECEPTOR EN VIVO
                </div>
            )}
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-11 px-6 border-border/60 hover:bg-muted font-bold tracking-tight">
            <TableIcon className="w-4 h-4 mr-2 text-primary" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportXLSX} className="h-11 px-6 border-border/60 hover:bg-muted font-bold tracking-tight">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
            EXCEL
          </Button>
        </div>
      </div>

      {/* Tabla con Estética Premium */}
      <div className="rounded-2xl border border-border/30 bg-card/20 overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="px-8 py-5 font-black text-foreground/70 uppercase text-[10px] tracking-[0.2em] italic">Prospecto</th>
                <th className="px-8 py-5 font-black text-foreground/70 uppercase text-[10px] tracking-[0.2em] italic">Contacto</th>
                <th className="px-8 py-5 font-black text-foreground/70 uppercase text-[10px] tracking-[0.2em] italic">Zona</th>
                <th className="px-8 py-5 font-black text-foreground/70 uppercase text-[10px] tracking-[0.2em] italic text-center">Score</th>
                <th className="px-8 py-5 font-black text-foreground/70 uppercase text-[10px] tracking-[0.2em] italic text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginatedLeads.map((lead, idx) => (
                <tr key={lead.id} className={`hover:bg-primary/5 transition-all duration-500 group border-l-4 border-transparent hover:border-primary ${idx === 0 && leads.length > initialLeads.length ? 'bg-primary/5 animate-in fade-in slide-in-from-left-4' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-foreground text-lg capitalize tracking-tight leading-tight group-hover:text-primary transition-colors">{lead.nombre}</span>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-1.5 bg-muted/30 px-2 py-0.5 rounded w-fit border border-border/20">{lead.tipo || 'Prospecto'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      {lead.telefono ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                          <Phone className="w-3.5 h-3.5 text-primary/70" />
                          <span>{lead.telefono}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 italic text-[11px] font-medium tracking-wide">SIN CONTACTO</span>
                      )}
                      {lead.web && (
                        <a href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary/80 hover:text-primary hover:underline transition-all text-sm font-medium">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="max-w-[160px] truncate">{lead.web.replace(/^https?:\/\//, '')}</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-2 max-w-[220px]">
                      <MapPin className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground/90 text-xs leading-relaxed font-bold tracking-tight line-clamp-2 italic">{lead.direccion || 'Ubicación no disponible'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center bg-background/40 px-4 py-2 rounded-xl border border-border/40 shadow-sm">
                      <div className="flex items-center gap-1.5 text-amber-500 font-black text-lg">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{lead.rating || 0}</span>
                      </div>
                      <span className="text-[9px] font-black text-muted-foreground/60 tracking-widest mt-0.5">{lead.reviews || 0} OPINIONES</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500 shadow-sm" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(lead.nombre + ' ' + (lead.direccion || ''))}`, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="py-32 text-center">
            <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <SearchIcon className="w-10 h-10 text-primary/20" />
            </div>
            <h3 className="text-2xl font-black text-foreground/90 uppercase italic tracking-tighter">Escaneando el Mapa...</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-3 font-medium px-4">Sus agentes inteligentes están en plena cacería de prospectos. Los resultados aparecerán aquí automáticamente.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-border/30 flex items-center justify-between bg-muted/5">
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] italic"> Página <span className="text-primary font-black">{currentPage}</span> / {totalPages} </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest italic rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest italic rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
