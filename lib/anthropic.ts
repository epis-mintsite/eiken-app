import Anthropic from "@anthropic-ai/sdk";
import { CorrectionResult } from "@/types/correction";
import { buildCorrectionPrompt } from "./prompt-builder";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function ocrFromImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "この画像に含まれる手書きの英文を正確にテキストとして書き起こしてください。改行や段落も保持してください。英文のみを出力し、他の説明は不要です。",
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from OCR");
  return block.text;
}

export async function correctEssay(
  originalText: string,
  topic: string,
  studentName: string,
  options?: { strictness?: string; customInstructions?: string }
): Promise<CorrectionResult> {
  const { system, user } = buildCorrectionPrompt(originalText, topic, studentName, options);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from correction");

  const jsonMatch = block.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse correction result JSON");

  return JSON.parse(jsonMatch[0]) as CorrectionResult;
}
