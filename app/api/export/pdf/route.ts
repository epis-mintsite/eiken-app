import { NextRequest, NextResponse } from "next/server";
import { generatePdf, PdfInput } from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const data: PdfInput = await request.json();

    const pdfBuffer = await generatePdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="eiken_report_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF生成に失敗しました" },
      { status: 500 }
    );
  }
}
