import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // 1. Verificación de Autenticación de Supabase en el backend
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado. Por favor inicia sesión.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: 'La consulta es obligatoria' }, { status: 400 })
    }

    // Generamos un ID de sesión aleatorio para agrupar los leads aunque no usemos tabla intermedia
    const searchId = crypto.randomUUID()

    // 2. Mandamos el Webhook a n8n, inyectando de forma SEGURA el user_id y el searchId
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/saas-scraper'

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        user_id: user.id,
        search_id: searchId
      })
    })

    if (!response.ok) {
      throw new Error(`n8n respondió con error ${response.status}`)
    }

    return NextResponse.json({ 
      message: 'Scraping iniciado con éxito',
      searchId: searchId 
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 })
  }
}
