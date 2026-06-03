import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// @ts-ignore
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import * as xlsx from "xlsx";

// Extend max duration for heavy embedding workloads if needed (Vercel specific config)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const agentId = formData.get("agent_id") as string;

    if (!file || !agentId) {
      return NextResponse.json({ error: "File or agent_id missing" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    
    if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      const data = new Uint8Array(buffer);
      const pdf = await getDocumentProxy(data);
      const extracted: any = await extractText(pdf);
      text = Array.isArray(extracted?.text) ? extracted.text.join("\n") : (extracted?.text || "");
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      let excelContent = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csv = xlsx.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
            excelContent += `### Hoja: ${sheetName}\n${csv}\n\n`;
        }
      });
      text = excelContent;
    } else if (file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await mammoth.extractRawText({ buffer });
      text = data.value;
    } else if (file.name.endsWith(".txt") || file.type === "text/plain") {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, XLSX, or TXT." }, { status: 400 });
    }

    if (!text || text.trim() === "") {
        return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    // Step 1: Record the full document in the DB
    const { data: document, error: docError } = await supabase
      .from("agent_documents")
      .insert({
        agent_id: agentId,
        file_name: file.name,
        file_size: file.size,
        content: text // Save FULL TEXT for zero-chunk context loading
      })
      .select()
      .single();

    if (docError) {
      return NextResponse.json({ error: "Failed to save document metadata: " + docError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
