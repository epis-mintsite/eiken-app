import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ocrFromImage } from "@/lib/anthropic";
import { buildCorrectionPrompt } from "@/lib/prompt-builder";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get("image") as File | null;
  const studentName = formData.get("studentName") as string;
  const topic = formData.get("topic") as string;
  const date = formData.get("date") as string;
  const strictness = (formData.get("strictness") as string) || "standard";
  const customInstructions = (formData.get("customInstructions") as string) || "";

  if (!image || !studentName || !topic) {
    return new Response(
      JSON.stringify({ error: "image, studentName, topic は必須です" }),
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
        // Step 1: OCR
        send("status", { step: "ocr", message: "手書き文字を読み取っています..." });

        const buffer = Buffer.from(await image.arrayBuffer());
        const imageBase64 = buffer.toString("base64");
        const mediaType = image.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

        const originalText = await ocrFromImage(imageBase64, mediaType);

        const wordCount = originalText
          .trim()
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length;

        send("ocr", { original_text: originalText, word_count: wordCount });

        // Step 2: Streaming correction
        send("status", { step: "correct", message: "採点・添削を実行中..." });

        const { system, user } = buildCorrectionPrompt(
          originalText,
          topic,
          studentName,
          { strictness, customInstructions }
        );

        let fullText = "";

        const streamResponse = await anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
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

        // Step 3: Parse result
        send("status", { step: "parse", message: "結果を処理中..." });

        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("添削結果のJSON解析に失敗しました");
        }

        const result = JSON.parse(jsonMatch[0]);

        // Step 4: Save to DB
        let imageUrl: string | null = null;
        let recordId: string | null = null;

        try {
          const fileName = `${Date.now()}_${image.name}`;
          const bucketName = process.env.STORAGE_BUCKET_NAME || "eiken-files";
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, { contentType: image.type });
          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(uploadData.path);
            imageUrl = urlData.publicUrl;
          }
        } catch {
          // skip
        }

        try {
          const { data: inserted, error: dbError } = await supabase
            .from("corrections")
            .insert({
              student_name: studentName,
              topic,
              date,
              original_text: originalText,
              image_url: imageUrl,
              score_content: result.scores.content,
              score_org: result.scores.organization,
              score_vocab: result.scores.vocabulary,
              score_grammar: result.scores.grammar,
              errors_json: result.errors,
              feedback_json: result.feedback,
              model_essay: result.model_essay,
              advice_json: result.advice,
              word_count: wordCount,
            })
            .select("id")
            .single();
          if (!dbError && inserted) recordId = inserted.id;
        } catch {
          // skip
        }

        // Final result
        send("result", {
          id: recordId,
          student_name: studentName,
          topic,
          original_text: originalText,
          image_url: imageUrl,
          scores: result.scores,
          score_total:
            result.scores.content +
            result.scores.organization +
            result.scores.vocabulary +
            result.scores.grammar,
          errors: result.errors,
          feedback: result.feedback,
          model_essay: result.model_essay,
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
