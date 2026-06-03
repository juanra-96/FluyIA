import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { url, agentId } = await req.json();

    if (!url || !agentId) {
      return NextResponse.json({ error: "URL o agentId faltante" }, { status: 400 });
    }

    // Intentar convertir la URL de Google Sheets a exportación CSV
    let exportUrl = url;
    if (url.includes("docs.google.com/spreadsheets/d/")) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        // Obtenemos el ID del documento y forzamos exportación a CSV
        exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    const response = await fetch(exportUrl);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: "No se pudo acceder a la hoja. Asegúrate de que el archivo esté 'Publicado en la Web' (Archivo > Compartir > Publicar en la Web) como CSV." 
      }, { status: 400 });
    }

    const text = await response.text();

    // Verificación básica de que no sea una página de login HTML de Google
    if (text.trim().startsWith("<!DOCTYPE html>") || text.includes("Google Drive - Quota exceeded")) {
      return NextResponse.json({ 
        error: "El enlace no devolvió datos válidos. Asegúrate de seleccionar 'Publicar en la Web' y elegir el formato 'Valores separados por comas (.csv)'." 
      }, { status: 400 });
    }

    // Guardar en la base de datos
    const { data: document, error: docError } = await supabase
      .from("agent_documents")
      .insert({
        agent_id: agentId,
        file_name: "Google Sheet (Conectado)",
        file_size: text.length,
        content: `### Google Sheet Context\n${text}`
      })
      .select()
      .single();

    if (docError) {
      return NextResponse.json({ error: "Error guardando en base de datos: " + docError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document });

  } catch (error: any) {
    console.error("Connect Sheet Error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
