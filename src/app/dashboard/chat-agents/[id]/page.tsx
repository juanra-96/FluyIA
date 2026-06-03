"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Send, FileText, UploadCloud, User, Bot, Sparkles, Pencil, X, Check, Trash2, Link as LinkIcon, Table } from "lucide-react"
import Link from "next/link"

export default function ChatAgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Doc Upload
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docs, setDocs] = useState<any[]>([])

  // Google Sheets Connecting
  const [sheetUrl, setSheetUrl] = useState("");
  const [connectingSheet, setConnectingSheet] = useState(false);
  const [showSheetInput, setShowSheetInput] = useState(false);

  // Chat
  const [messages, setMessages] = useState<{role:string, content:string}[]>([])
  const [inputMsg, setInputMsg] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Edit Model
  const [editingModel, setEditingModel] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  async function fetchOpenRouterModels() {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      const data = await res.json();
      let fetchedModels = data.data;
      fetchedModels.sort((a: any, b: any) => {
        const aFree = parseFloat(a.pricing?.prompt || "1") === 0 && parseFloat(a.pricing?.completion || "1") === 0;
        const bFree = parseFloat(b.pricing?.prompt || "1") === 0 && parseFloat(b.pricing?.completion || "1") === 0;
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return a.name.localeCompare(b.name);
      });
      setOpenRouterModels(fetchedModels);
    } catch(err) { console.error(err); }
  }

  function handleEditModel() {
    setSelectedModel(agent.model);
    setEditingModel(true);
    if (openRouterModels.length === 0) fetchOpenRouterModels();
  }

  async function saveModel() {
    if (!selectedModel) return;
    setSavingModel(true);
    const { error } = await supabase.from("chat_agents").update({ model: selectedModel }).eq("id", agent.id);
    if (!error) {
       setAgent({...agent, model: selectedModel});
       setEditingModel(false);
    } else {
       alert("Error salvando modelo: " + error.message);
    }
    setSavingModel(false);
  }


  useEffect(() => {
    fetchAgent()
    fetchDocs()
  }, [agentId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages])

  async function fetchAgent() {
    const { data } = await supabase.from("chat_agents").select("*").eq("id", agentId).single();
    if(data) setAgent(data)
    setLoading(false)
  }

  async function fetchDocs() {
    const { data } = await supabase.from("agent_documents").select("*").eq("agent_id", agentId).order("created_at", { ascending: false });
    if(data) setDocs(data)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("agent_id", agentId);

    try {
      const res = await fetch("/api/agents/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await fetchDocs();
      alert("Documento procesado y vectorizado exitosamente.")
    } catch (error: any) {
      alert("Error procesando documento: " + error.message)
    } finally {
      setUploadingDoc(false)
      // reset file input
      e.target.value = '';
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) return;

    try {
      const { error } = await supabase
        .from("agent_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (error: any) {
      alert("Error eliminando documento: " + error.message);
    }
  }

  async function handleConnectSheet() {
    if (!sheetUrl.trim()) return;
    setConnectingSheet(true);
    try {
      const res = await fetch("/api/agents/connect-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sheetUrl, agentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSheetUrl("");
      setShowSheetInput(false);
      await fetchDocs();
      alert("Google Sheet conectado exitosamente.");
    } catch (err: any) {
      alert("Error conectando Sheet: " + err.message);
    } finally {
      setConnectingSheet(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if(!inputMsg.trim()) return;

    const userMsg = inputMsg.trim();
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInputMsg("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          agentId: agentId,
          history: messages // pass prev history for memory
        })
      });

      if(!res.ok) {
        let errorMsg = "Error en la respuesta";
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
      if(!res.body) throw new Error("Error de red");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantResponse += decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1].content = assistantResponse;
          return newArr;
        });
      }
    } catch(err:any) {
       console.error(err);
       setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, ocurrió un error procesando tu solicitud."}]);
    } finally {
      setIsTyping(false);
    }
  }

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
  if (!agent) return <div className="text-center p-20 font-bold">Agente no encontrado</div>

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full max-w-7xl mx-auto p-4 md:p-6 gap-6">
      <div className="flex items-center gap-4 border-b pb-4 shrink-0">
        <Link href="/dashboard/chat-agents">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            {agent.name} 
            
            {editingModel ? (
              <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                <select 
                  className="h-8 px-2 rounded border bg-background text-xs max-w-[200px]"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  {openRouterModels.length === 0 ? <option value={selectedModel}>Cargando...</option> : null}
                  {openRouterModels.map(m => {
                    const isFree = parseFloat(m.pricing?.prompt || "1") === 0 && parseFloat(m.pricing?.completion || "1") === 0;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} {isFree ? "✨ (Gratis)" : ""}
                      </option>
                    )
                  })}
                </select>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={saveModel} disabled={savingModel}>
                  {savingModel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setEditingModel(false)} disabled={savingModel}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                {agent.model}
                <button onClick={handleEditModel} className="hover:text-primary/70 transition-colors ml-1"><Pencil className="w-3 h-3"/></button>
              </span>
            )}

          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{agent.role}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Col: Knowledge Base */}
        <div className="lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" /> Personalidad
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{agent.personality}</p>
          </div>

          <div className="bg-card border rounded-xl shadow-sm flex flex-col flex-1">
            <div className="p-5 border-b">
              <h3 className="font-semibold flex items-center gap-2 mb-1">Base de Conocimiento</h3>
              <p className="text-xs text-muted-foreground mb-4">Usa archivos (PDF, DOCX, XLSX, TXT) o conecta Google Sheets.</p>
              
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".txt,.pdf,.docx,.xlsx,.xls,.csv" 
                    className="hidden" 
                    id="doc-upload"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                  />
                  <Button variant="outline" className="w-full cursor-pointer h-10 dashed-border bg-muted/20 relative">
                    <label htmlFor="doc-upload" className="absolute inset-0 flex items-center justify-center gap-2 cursor-pointer">
                      {uploadingDoc ? (
                        <><Loader2 className="w-4 h-4 animate-spin"/> Procesando...</>
                      ) : (
                        <><UploadCloud className="w-4 h-4 text-primary"/> Adjuntar Archivo</>
                      )}
                    </label>
                  </Button>
                </div>

                {!showSheetInput ? (
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-2 text-primary" onClick={() => setShowSheetInput(true)}>
                    <LinkIcon className="w-3 h-3" /> Conectar Google Sheet
                  </Button>
                ) : (
                  <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Enlace de Google Sheet</span>
                      <button onClick={() => setShowSheetInput(false)}><X className="w-3 h-3"/></button>
                    </div>
                    <Input 
                      placeholder="Pega el link aquí..." 
                      className="h-8 text-xs" 
                      value={sheetUrl}
                      onChange={e => setSheetUrl(e.target.value)}
                    />
                    <Button 
                      className="w-full h-8 text-xs" 
                      onClick={handleConnectSheet}
                      disabled={connectingSheet || !sheetUrl.trim()}
                    >
                      {connectingSheet ? <Loader2 className="w-3 h-3 animate-spin"/> : "Conectar Sheet"}
                    </Button>
                    <p className="text-[9px] text-muted-foreground leading-tight">
                      * El archivo debe estar en <b>Archivo &gt; Compartir &gt; Publicar en la Web</b> como CSV.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 h-[200px]">
              {docs.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Sin documentos todavía. El agente responderá basándose en su IA nativa.
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background group relative">
                      {doc.file_name?.includes("Sheet") ? (
                        <Table className="w-8 h-8 text-green-600 shrink-0" />
                      ) : doc.file_name?.endsWith(".xlsx") || doc.file_name?.endsWith(".xls") || doc.file_name?.endsWith(".csv") ? (
                        <Table className="w-8 h-8 text-green-700 shrink-0" />
                      ) : (
                        <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                      )}
                      
                      <div className="overflow-hidden pr-8">
                        <p className="text-sm font-medium truncate" title={doc.file_name}>{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_name?.includes("Sheet") ? "Conexión en vivo" : `${(doc.file_size / 1024).toFixed(1)} KB`} • Texto completo
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Col: Chat Interface */}
        <div className="lg:w-2/3 bg-background border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="h-14 border-b bg-card/50 flex items-center px-4 font-semibold shrink-0">
            Simulador de Chat
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Bot className="w-12 h-12 opacity-50" />
                <p>Envía un mensaje para comenzar a probar este agente.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                </div>
                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex gap-3 max-w-[85%] mr-auto">
                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4"/>
                 </div>
                 <div className="p-3 bg-muted rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                   <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"></div>
                 </div>
               </div>
            )}
          </div>

          <div className="p-4 bg-card/50 border-t shrink-0">
            <form onSubmit={sendMessage} className="relative flex items-center">
              <Input 
                className="pr-12 h-12 rounded-full bg-background"
                placeholder="Escribe un mensaje..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                disabled={isTyping}
              />
              <Button type="submit" disabled={isTyping || !inputMsg.trim()} size="icon" className="absolute right-1 w-10 h-10 rounded-full">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
