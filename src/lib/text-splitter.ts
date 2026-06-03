export class RecursiveCharacterTextSplitter {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];

  constructor(options?: { chunkSize?: number; chunkOverlap?: number; separators?: string[] }) {
    this.chunkSize = options?.chunkSize ?? 1000;
    this.chunkOverlap = options?.chunkOverlap ?? 200;
    this.separators = options?.separators ?? ["\n\n", "\n", " ", ""];
  }

  splitText(text: string): string[] {
    const defaultSplitter = this.separators[0] || "";
    let finalChunks: string[] = [];

    const split = (textToSplit: string, depth: number) => {
      if (textToSplit.length <= this.chunkSize) {
        if (textToSplit.trim() !== "") {
          finalChunks.push(textToSplit);
        }
        return;
      }

      const separator = this.separators[Math.min(depth, this.separators.length - 1)];
      const parts = separator === "" ? textToSplit.split("") : textToSplit.split(separator);
      
      let currentChunk = "";
      
      for (const part of parts) {
        const potentialChunk = currentChunk + (currentChunk !== "" ? separator : "") + part;
        if (potentialChunk.length <= this.chunkSize) {
          currentChunk = potentialChunk;
        } else {
          if (currentChunk.trim() !== "") {
            finalChunks.push(currentChunk);
            // Handling overlap: we take a portion from the end of currentChunk
            const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - this.chunkOverlap));
            currentChunk = overlapText + (overlapText !== "" ? separator : "") + part;
            if (currentChunk.length > this.chunkSize) {
              currentChunk = part; // Too long even with overlap, reset to part
            }
          } else {
            // First part was too big already, we must split it with next deeper separator
            split(part, depth + 1);
          }
        }
      }
      
      if (currentChunk.trim() !== "") {
        finalChunks.push(currentChunk);
      }
    };

    split(text, 0);
    return finalChunks;
  }
}
