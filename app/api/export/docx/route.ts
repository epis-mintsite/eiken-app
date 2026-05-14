import { NextRequest, NextResponse } from "next/server";
import { generateDocx, DocxInput } from "@/lib/docx-generator";

export async function POST(request: NextRequest) {
  try {
    const data: DocxInput = await request.json();

    const docxBuffer = await generateDocx(data);

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="eiken_report_${Date.now()}.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Word生成に失敗しました" },
      { status: 500 }
    );
  }
}
