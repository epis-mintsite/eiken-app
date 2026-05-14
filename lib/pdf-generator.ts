import { spawn } from "child_process";
import path from "path";

export interface PdfInput {
  student_name: string;
  topic: string;
  original_text: string;
  scores: { content: number; organization: number; vocabulary: number; grammar: number };
  errors: { id: number; original: string; type: string; correction: string }[];
  feedback: { content: string; organization: string; vocabulary: string; grammar: string };
  model_essay: string;
  advice: { priority: string; title: string; body: string }[];
  word_count: number;
}

export function generatePdf(data: PdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "generate_pdf.py");
    const env = { ...process.env };
    const brewLib = "/opt/homebrew/lib";
    env.DYLD_LIBRARY_PATH = env.DYLD_LIBRARY_PATH
      ? `${brewLib}:${env.DYLD_LIBRARY_PATH}`
      : brewLib;
    const proc = spawn("python3", [scriptPath], { env });

    const chunks: Buffer[] = [];
    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));

    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`PDF generation failed (code ${code}): ${stderr}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start PDF generator: ${err.message}`));
    });

    proc.stdin.write(JSON.stringify(data));
    proc.stdin.end();
  });
}
