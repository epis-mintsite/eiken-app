import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSummaryPrompt } from "@/lib/summary-prompt-builder";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { passageText, answerText, studentName, date, strictness, customInstructions } = body;

  if (!passageText || !answerText) {
    return new Response(
      JSON.stringify({ error: "passageText, answerText は必須です" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const wordCount = answerText
          .trim()
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length;

        // Step 1: Build prompt and start streaming
        send("status", { step: "correct", message: "採点・添削を実行中..." });

        const { system, user } = buildSummaryPrompt(
          passageText,
          answerText,
          studentName || "",
          { strictness: strictness || "standard", customInstructions: customInstructions || "" }
        );

        let fullText = "";

        const streamResponse = await anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 6144,
          system,
          messages: [{ role: "user", content: user }],
        });

        for await (const event of streamResponse) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            send("delta", { text: event.delta.text });
          }
        }

        // Step 2: Parse result
        send("status", { step: "parse", message: "結果を処理中..." });

        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("添削結果のJSON解析に失敗しました");
        }

        const result = JSON.parse(jsonMatch[0]);

        // Step 3: Save to DB
        let recordId: string | null = null;

        try {
          const { data: inserted, error: dbError } = await supabase
            .from("corrections")
            .insert({
              type: "summary",
              student_name: studentName || "未入力",
              topic: "英文要約",
              date: date || new Date().toISOString().slice(0, 10),
              original_text: answerText,
              passage_text: passageText,
              image_url: null,
              score_content: result.scores.content,
              score_org: result.scores.organization,
              score_vocab: result.scores.vocabulary,
              score_grammar: result.scores.grammar,
              errors_json: result.errors,
              feedback_json: result.feedback,
              model_essay: result.model_essay,
              advice_json: result.advice,
              word_count: wordCount,
              good_points_json: result.good_points,
              content_analysis_json: result.content_analysis,
              vocab_suggestions_json: result.vocabulary_suggestions,
            })
            .select("id")
            .single();
          if (!dbError && inserted) recordId = inserted.id;
        } catch {
          // DB未設定の場合はスキップ
        }

        // Final result
        send("result", {
          id: recordId,
          type: "summary",
          student_name: studentName || "未入力",
          passage_text: passageText,
          original_text: answerText,
          scores: result.scores,
          score_total:
            result.scores.content +
            result.scores.organization +
            result.scores.vocabulary +
            result.scores.grammar,
          good_points: result.good_points,
          errors: result.errors,
          content_analysis: result.content_analysis,
          vocabulary_suggestions: result.vocabulary_suggestions,
          feedback: result.feedback,
          model_essay: result.model_essay,
          model_essay_annotations: result.model_essay_annotations,
          advice: result.advice,
          word_count: wordCount,
        });
      } catch (error) {
        send("error", {
          message:
            error instanceof Error ? error.message : "添削処理中にエラーが発生しました",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
