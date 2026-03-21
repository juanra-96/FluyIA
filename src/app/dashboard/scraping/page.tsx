import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ScrapingForm from './ScrapingForm'
import ScrapingResults from './ScrapingResults'
import HistoryList from './HistoryList'
import { SearchIcon, History, Calendar, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ id?: string }>
}

export default async function ScrapingPage({ searchParams }: SearchParams) {
  const supabase = await createClient()
  const params = await searchParams
  const activeSearchId = params.id

  // 1. Obtener historial desde la nueva tabla de sesiones (Índice optimizado)
  const { data: sessionData, error: sessionError } = await supabase
    .from('scraping_searches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (sessionError) {
    console.error('Error cargando historial:', sessionError)
  }

  const searches = sessionData?.map(item => {
    const isLiteral = item.search_id?.includes('{{') || false;
    const key = (item.search_id && !isLiteral) ? item.search_id : `q:${item.query}`;
    
    return {
      id: item.search_id,
      query: item.query,
      created_at: item.created_at,
      isContextQuery: !item.search_id || isLiteral,
      key: key
    }
  }) || [];

  // 2. Obtener leads según el contexto (ID o Query Fallback)
  let queryRequest = supabase.from('scraped_leads').select('*')
  
  if (activeSearchId) {
    // Si el ID de la URL empieza por "q:", es una búsqueda antigua por texto
    if (activeSearchId.startsWith('q:')) {
      const queryText = activeSearchId.replace('q:', '')
      queryRequest = queryRequest.eq('query', queryText)
    } else {
      queryRequest = queryRequest.eq('search_id', activeSearchId)
    }
  } else {
    queryRequest = queryRequest.order('created_at', { ascending: false }).limit(200)
  }

  const { data: leads, error } = await queryRequest

  // Encontrar la búsqueda activa para el título
  const activeSearch = searches?.find(s => s.key === activeSearchId)

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutGrid className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Módulo de Prospección</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Buscador de Leads</h2>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Extrae datos estratégicos de Google Maps vinculados a tu cuenta de FluyIA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Columna Izquierda: Formulario e Historial */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-border/50 shadow-md bg-card/50 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <SearchIcon className="w-4 h-4 text-primary" />
                Nueva Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrapingForm />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Historial Reciente
              </CardTitle>
              <CardDescription>Sesiones detectadas</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
                <HistoryList initialSearches={searches} activeId={activeSearchId} />
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Tabla de Resultados y Filtros */}
        <div className="lg:col-span-3">
          <Card className="border-border/50 shadow-xl min-h-[600px]">
            <CardContent className="pt-6">
              {error && (
                <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100">
                    <p className="text-red-500 font-medium">Error al cargar datos.</p>
                    <p className="text-red-400 text-xs mt-1">Asegúrate de haber añadido las columnas query y search_id en Supabase.</p>
                </div>
              )}
              
              {!error && leads && (
                <ScrapingResults 
                    initialLeads={leads} 
                    activeSearchId={activeSearchId} 
                    activeSearchRaw={activeSearch}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
