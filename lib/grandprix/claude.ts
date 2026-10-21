import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Division, FeedbackLang, GPDraftCheck } from "@/types/grandprix";
import { essayModel, EssayRefusalError } from "@/lib/essay/claude";
import { buildGPSystemPrompt, buildGPUserPrompt } from "@/lib/grandprix/prompts";
import { GP_CHECK_SCHEMA, isGPDraftCheck, normalizeGPDraftCheck } from "@/lib/grandprix/schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 4,
});

/**
 * 下書きチェックを実行し、構造化された結果を返す。
 * 呼び方は lib/essay/claude.ts と同じ（structured outputs ＋ サーバー側フォールバック、モデルは ESSAY_MODEL を共用）。
 */
export async function generateGPDraftCheck(params: {
  division: Division;
  feedbackLang: FeedbackLang;
  knock: string;
  country: string;
  grade: string;
  title: string;
  summary: string;
  body: string;
}): Promise<{ feedback: GPDraftCheck; model: string }> {
  const request = {
    model: essayModel(),
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    // SDK 0.95 の型には未定義のため、型を広げて渡す
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: GP_CHECK_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: buildGPSystemPrompt(params.division, params.feedbackLang),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildGPUserPrompt(params),
      },
    ],
  } as unknown as Anthropic.Beta.Messages.MessageCreateParamsStreaming;

  const message = await anthropic.beta.messages.stream(request).finalMessage();

  if (message.stop_reason === "refusal") {
    throw new EssayRefusalError(
      "この下書きはAIがチェックできませんでした。内容を確認して、先生に相談してください。"
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("チェック結果が長くなりすぎて途中で止まりました。もう一度お試しください。");
  }

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("チェック結果の読み取りに失敗しました。もう一度お試しください。");
  }
  if (!isGPDraftCheck(parsed)) {
    throw new Error("チェック結果の形式が正しくありませんでした。もう一度お試しください。");
  }

  return { feedback: normalizeGPDraftCheck(parsed), model: message.model };
}
