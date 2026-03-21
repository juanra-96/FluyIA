import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Aquí puedes realizar validaciones y enrutar
    // hacia tu instancia de n8n en Docker / Cloudflare
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: "Missing n8n configuration" }, { status: 500 });
    }

    // Forward the request to n8n
    /*
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    */
    
    return NextResponse.json({ success: true, message: "Webhook received and ready to route" });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
