import { NextRequest, NextResponse } from "next/server";
import { generatePdfReport, PdfInput } from "@/lib/pdf-report";

export async function POST(request: NextRequest) {
  try {
    const data: PdfInput = await request.json();

    const pdfBuffer = await generatePdfReport(data);

    const studentName = data.student_name || "report";
    const dateStr = data.date || new Date().toISOString().slice(0, 10);
    const filename = `eiken_${studentName}_${dateStr}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(pdfBuffer.length),
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
