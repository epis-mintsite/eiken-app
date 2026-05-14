import { NextRequest, NextResponse } from "next/server";
import { ocrFromImage, correctEssay } from "@/lib/anthropic";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const studentName = formData.get("studentName") as string;
    const topic = formData.get("topic") as string;
    const date = formData.get("date") as string;
    const strictness = (formData.get("strictness") as string) || "standard";
    const customInstructions = (formData.get("customInstructions") as string) || "";

    if (!image || !studentName || !topic) {
      return NextResponse.json(
        { error: "image, studentName, topic は必須です" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const imageBase64 = buffer.toString("base64");
    const mediaType = image.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    // 1. OCR
    const originalText = await ocrFromImage(imageBase64, mediaType);

    // 2. 添削・採点
    const result = await correctEssay(originalText, topic, studentName, {
      strictness,
      customInstructions,
    });

    const wordCount = originalText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // 3. 画像を Supabase Storage にアップロード
    let imageUrl: string | null = null;
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
      // ストレージ未設定の場合はスキップ
    }

    // 4. DB に保存
    let recordId: string | null = null;
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

      if (!dbError && inserted) {
        recordId = inserted.id;
      }
    } catch {
      // DB 未設定の場合はスキップ
    }

    return NextResponse.json({
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
    console.error("Correction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "添削処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
