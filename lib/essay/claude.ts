import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { DocType, EssayFeedback } from "@/types/essay";
import { buildEssaySystemPrompt, buildEssayUserPrompt } from "@/lib/essay/prompts";
import { ESSAY_FEEDBACK_SCHEMA, isEssayFeedback } from "@/lib/essay/schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 4,
});

/** 既定は Sonnet 5.5。ESSAY_MODEL で切り替える（例: claude-opus-5-5） */
export function essayModel(): string {
  return process.env.ESSAY_MODEL || "claude-sonnet-5-5";
}

export class EssayRefusalError extends Error {}

/**
 * 添削を実行し、構造化された結果を返す。
 * 出力の形は structured outputs（output_config.format）で強制する。
 * 安全分類器による拒否に備え、サーバー側フォールバック（fallbacks: "default"）を有効にしている。
 */
export async function generateEssayFeedback(params: {
  docType: DocType;
  theme: string;
  studentName: string;
  grade: string;
  text: string;
}): Promise<{ feedback: EssayFeedback; model: string }> {
  const request = {
    model: essayModel(),
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    // SDK 0.95 の型には未定義のため、型を広げて渡す
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: ESSAY_FEEDBACK_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: buildEssaySystemPrompt(params.docType),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildEssayUserPrompt(params),
      },
    ],
  } as unknown as Anthropic.Beta.Messages.MessageCreateParamsStreaming;

  const message = await anthropic.beta.messages.stream(request).finalMessage();

  if (message.stop_reason === "refusal") {
    throw new EssayRefusalError(
      "この答案はAIが添削できませんでした。内容を確認して、講師に相談してください。"
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("添削結果が長くなりすぎて途中で止まりました。本文を短くして再度お試しください。");
  }

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("添削結果の読み取りに失敗しました。もう一度お試しください。");
  }
  if (!isEssayFeedback(parsed)) {
    throw new Error("添削結果の形式が正しくありませんでした。もう一度お試しください。");
  }

  return { feedback: parsed, model: message.model };
}
