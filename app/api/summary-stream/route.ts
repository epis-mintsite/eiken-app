import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ocrFromImage, friendlyAIErrorMessage } from "@/lib/anthropic";
import { buildSummaryPrompt } from "@/lib/summary-prompt-builder";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 4,
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const passageImage = formData.get("passageImage") as File | null;
  const answerImage = formData.get("answerImage") as File | null;
  const studentName = (formData.get("studentName") as string) || "";
  const date = (formData.get("date") as string) || new Date().toISOString().slice(0, 10);
  const strictness = (formData.get("strictness") as string) || "standard";
  const customInstructions = (formData.get("customInstructions") as string) || "";

  if (!passageImage || !answerImage) {
    return new Response(
      JSON.stringify({ error: "課題文の写真と解答の写真は必須です" }),
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
        // Step 1: OCR passage image
        send("status", { step: "ocr-passage", message: "課題文を読み取っています..." });

        const passageBuffer = Buffer.from(await passageImage.arrayBuffer());
        const passageBase64 = passageBuffer.toString("base64");
        const passageMediaType = passageImage.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

        const passageText = await ocrFromImage(passageBase64, passageMediaType);

        send("ocr-passage", { passage_text: passageText });

        // Step 2: OCR answer image
        send("status", { step: "ocr-answer", message: "生徒の解答を読み取っています..." });

        const answerBuffer = Buffer.from(await answerImage.arrayBuffer());
        const answerBase64 = answerBuffer.toString("base64");
        const answerMediaType = answerImage.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

        const answerText = await ocrFromImage(answerBase64, answerMediaType);

        const wordCount = answerText
          .trim()
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length;

        send("ocr-answer", { answer_text: answerText, word_count: wordCount });

        // Step 3: Build prompt and start streaming correction
        send("status", { step: "correct", message: "採点・添削を実行中..." });

        const { system, user } = buildSummaryPrompt(
          passageText,
          answerText,
          studentName,
          { strictness, customInstructions }
        );

        let fullText = "";

        const streamResponse = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
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

        // Step 4: Parse result
        send("status", { step: "parse", message: "結果を処理中..." });

        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("添削結果のJSON解析に失敗しました");
        }

        const result = JSON.parse(jsonMatch[0]);

        // Step 5: Save to DB
        let recordId: string | null = null;

        try {
          const { data: inserted, error: dbError } = await supabase
            .from("corrections")
            .insert({
              type: "summary",
              student_name: studentName || "未入力",
              topic: "英文要約",
              date,
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
              summary_points_json: result.summary_writing_points,
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
          summary_writing_points: result.summary_writing_points || [],
          advice: result.advice,
          word_count: wordCount,
        });
      } catch (error) {
        send("error", { message: friendlyAIErrorMessage(error) });
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
