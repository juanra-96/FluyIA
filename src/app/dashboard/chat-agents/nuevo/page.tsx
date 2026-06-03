"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Sparkles, Bot } from "lucide-react"
import Link from "next/link"

type OpenRouterModel = {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
};

export default function CreateChatAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    role: "Asistente de Servicio al Cliente",
    personality: "Eres amable, conciso y profesional. Respondes dudas usando solo la información proporcionada. Si no sabes algo, invitas al usuario a contactar soporte.",
    model: "openai/gpt-4o-mini"
  });

  useEffect(() => {
    fetch("https://openrouter.ai/api/v1/models")
      .then(res => res.json())
      .then(data => {
        let fetchedModels = data.data as OpenRouterModel[];
        
        // Sort: free models first
        fetchedModels.sort((a, b) => {
          const aFree = parseFloat(a.pricing?.prompt || "1") === 0 && parseFloat(a.pricing?.completion || "1") === 0;
          const bFree = parseFloat(b.pricing?.prompt || "1") === 0 && parseFloat(b.pricing?.completion || "1") === 0;
          if (aFree && !bFree) return -1;
          if (!aFree && bFree) return 1;
          return a.name.localeCompare(b.name);
        });

        setModels(fetchedModels);
        setLoadingModels(false);
      })
      .catch(err => {
        console.error("Failed to fetch models", err);
        setLoadingModels(false);
      });
  }, []);

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) || 
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      alert("Debes iniciar sesión para crear un agente.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("chat_agents").insert({
      user_id: userId,
      name: form.name,
      role: form.role,
      personality: form.personality,
      model: form.model
    }).select().single();

    setLoading(false);

    if (error) {
      alert("Error creando agente: " + error.message);
    } else if (data) {
      router.push(`/dashboard/chat-agents/${data.id}`);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/chat-agents">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Agente</h1>
          <p className="text-muted-foreground mt-1">Configura la identidad y comportamiento base del agente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-8 shadow-sm">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold">Nombre del Agente</label>
          <Input 
            required 
            placeholder="Ej. 'Soporte Ventas' o 'Pepe Bot'" 
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Rol</label>
          <Input 
            required 
            placeholder="El papel que debe asumir la IA" 
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center justify-between">
            Personalidad y Comportamiento Base
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3"/> System Prompt
            </span>
          </label>
          <textarea 
            required 
            className="w-full min-h-[120px] p-3 text-sm rounded-md border bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Define las instrucciones claras de cómo debe interactuar el agente."
            value={form.personality}
            onChange={e => setForm({...form, personality: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Modelo de Inteligencia Artificial (OpenRouter)</label>
          <Input 
            placeholder="Buscar modelo (ej. free, qwen, llama...)" 
            className="mb-2"
            value={modelSearch}
            onChange={e => setModelSearch(e.target.value)}
          />
          <select 
            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            value={form.model}
            onChange={e => setForm({...form, model: e.target.value})}
            disabled={loadingModels}
          >
            {loadingModels && <option value="">Cargando modelos desde OpenRouter...</option>}
            {!loadingModels && filteredModels.map(m => {
              const isFree = parseFloat(m.pricing?.prompt || "1") === 0 && parseFloat(m.pricing?.completion || "1") === 0;
              return (
                <option key={m.id} value={m.id}>
                  {m.name} {isFree ? "✨ (Gratis)" : ""}
                </option>
              )
            })}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Estos modelos serán consultados vía OpenRouter usando tu API Key.</p>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link href="/dashboard/chat-agents">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            Continuar a Conexión de Documentos
          </Button>
        </div>
      </form>
    </div>
  )
}
