import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

// Optional: Enable Edge runtime if we don't depend on heavy Node.js libraries in this specific route.
// But generateEmbedding might use Node APIs depending on Xenova transformers. Keep it standard for now.

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, agentId, history = [] } = await req.json();

    if (!message || !agentId) {
      return NextResponse.json({ error: "Message or agentId missing" }, { status: 400 });
    }

    // 1. Get Agent context
    const { data: agent, error: agentError } = await supabase
      .from("chat_agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 2. Search for the actual full documents injected for this agent
    const { data: documents, error: searchError } = await supabase
      .from("agent_documents")
      .select("content")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (searchError) {
      console.error("Document Fetch Error:", searchError);
      // We don't fail completely, just go without context.
    }

    // 3. Construct System Prompt
    let contextText = "";
    if (documents && documents.length > 0) {
      contextText = "Utiliza ABSOLUTAMENTE TODO el siguiente contexto para enriquecer tu respuesta si es relevante al usuario:\n\n---\n" + 
                    documents.map((d: any) => d.content).join("\n\n---\n");
    }

    const systemPrompt = `Eres ${agent.name}. Rol: ${agent.role}
Personalidad: ${agent.personality}

${contextText}`;
    // Translate deprecated llama model if necessary
    let selectedModel = agent.model || "openai/gpt-4o-mini";
    if (selectedModel.includes("meta-llama/llama-3")) {
      selectedModel = "nvidia/llama-3.1-nemotron-70b-instruct:free";
    }

    // 5. Call OpenRouter
    const chatStream = await openai.chat.completions.create({
      model: selectedModel, // Fallback if no model specified
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message }
      ],
      stream: true,
    });

    // We can use Next.js's standard ReadableStream to pipe back to the client
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatStream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
