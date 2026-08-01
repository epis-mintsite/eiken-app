import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// ---- Types ----

export interface WritingPdfInput {
  type?: "writing";
  student_name: string;
  topic: string;
  original_text: string;
  date?: string;
  scores: { content: number; organization: number; vocabulary: number; grammar: number };
  errors: { id: number; original: string; type: string; correction: string }[];
  feedback: { content: string; organization: string; vocabulary: string; grammar: string };
  model_essay: string;
  advice: { priority: string; title: string; body: string }[];
  word_count: number;
}

export interface SummaryPdfInput {
  type: "summary";
  student_name: string;
  passage_text?: string;
  original_text: string;
  date?: string;
  scores: { content: number; organization: number; vocabulary: number; grammar: number };
  good_points?: string[];
  errors: { id: number; original: string; type: string; correction: string; explanation?: string }[];
  content_analysis?: { key_points_coverage: string; unnecessary_content: string; structure_issues: string };
  vocabulary_suggestions?: { original: string; suggested: string; reason: string }[];
  feedback: { content: string; organization: string; vocabulary: string; grammar: string };
  model_essay: string;
  advice: { priority: string; title: string; body: string }[];
  word_count: number;
}

export type PdfInput = WritingPdfInput | SummaryPdfInput;

// ---- Colors ----

const COLORS = {
  primary: "#6C5CE7",
  dark: "#37352F",
  gray: "#6B6B6B",
  lightGray: "#9B9A97",
  border: "#E3E2DE",
  bg: "#F7F6F3",
  red: "#EB5757",
  green: "#4CAF50",
  orange: "#FF9800",
  teal: "#4DB6AC",
  pink: "#E255A1",
  white: "#FFFFFF",
};

// ---- Font loading ----

function getFontPath(name: string): string {
  // Try multiple paths for both local and Vercel deployment
  const candidates = [
    path.join(process.cwd(), "public", "fonts", name),
    path.join(process.cwd(), "fonts", name),
    path.join(__dirname, "..", "public", "fonts", name),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Font not found: ${name}. Tried: ${candidates.join(", ")}`);
}

// ---- Helpers ----

const PAGE = {
  width: 595.28,   // A4
  height: 841.89,
  margin: 50,
  get contentWidth() { return this.width - this.margin * 2; },
  bottomLimit: 780,
};

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PAGE.bottomLimit) {
    doc.addPage();
    return PAGE.margin;
  }
  return y;
}

function drawLine(doc: PDFKit.PDFDocument, y: number): number {
  doc.strokeColor(COLORS.border).lineWidth(0.5)
    .moveTo(PAGE.margin, y).lineTo(PAGE.width - PAGE.margin, y).stroke();
  return y + 10;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  y = checkPageBreak(doc, y, 30);
  doc.font("NotoSansBold").fontSize(13).fillColor(COLORS.dark).text(title, PAGE.margin, y);
  y += 18;
  doc.strokeColor(COLORS.primary).lineWidth(1.5)
    .moveTo(PAGE.margin, y).lineTo(PAGE.margin + 40, y).stroke();
  return y + 8;
}

// ---- Table drawing ----

interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
}

function drawTable(
  doc: PDFKit.PDFDocument,
  y: number,
  columns: TableColumn[],
  rows: string[][],
  opts?: { headerBg?: string; headerColor?: string }
): number {
  const headerBg = opts?.headerBg || COLORS.primary;
  const headerColor = opts?.headerColor || COLORS.white;
  const rowHeight = 24;
  const cellPadding = 6;
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const startX = PAGE.margin;

  // Header
  y = checkPageBreak(doc, y, rowHeight + rowHeight * Math.min(rows.length, 3));
  doc.rect(startX, y, tableWidth, rowHeight).fill(headerBg);
  let x = startX;
  for (const col of columns) {
    doc.font("NotoSansBold").fontSize(8.5).fillColor(headerColor);
    const textX = col.align === "center" ? x + col.width / 2 : x + cellPadding;
    const textOpts = col.align === "center" ? { width: col.width - cellPadding * 2, align: "center" as const } : { width: col.width - cellPadding * 2 };
    doc.text(col.header, textX, y + 7, textOpts);
    x += col.width;
  }
  y += rowHeight;

  // Rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Measure max height for this row
    const cellHeights = row.map((cell, i) => {
      const colW = columns[i].width - cellPadding * 2;
      const h = doc.font("NotoSansRegular").fontSize(8).heightOfString(cell, { width: colW });
      return Math.max(h + 10, rowHeight);
    });
    const maxH = Math.max(...cellHeights);

    y = checkPageBreak(doc, y, maxH);

    // Alternate bg
    if (r % 2 === 0) {
      doc.rect(startX, y, tableWidth, maxH).fill("#FBFBFA");
    }
    // Bottom border
    doc.strokeColor(COLORS.border).lineWidth(0.3)
      .moveTo(startX, y + maxH).lineTo(startX + tableWidth, y + maxH).stroke();

    x = startX;
    for (let i = 0; i < columns.length; i++) {
      doc.font("NotoSansRegular").fontSize(8).fillColor(COLORS.dark);
      const colW = columns[i].width - cellPadding * 2;
      const textOpts: { width: number; align?: "left" | "center" | "right" } = { width: colW };
      if (columns[i].align) textOpts.align = columns[i].align;
      doc.text(row[i] || "", x + cellPadding, y + 5, textOpts);
      x += columns[i].width;
    }
    y += maxH;
  }

  return y + 8;
}

// ---- Main generator ----

export async function generatePdfReport(data: PdfInput): Promise<Buffer> {
  const regularFont = getFontPath("NotoSansJP-Regular.ttf");
  const boldFont = getFontPath("NotoSansJP-Bold.otf");

  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    info: {
      Title: `添削レポート - ${data.student_name}`,
      Author: "上級ライティング添削",
    },
  });

  doc.registerFont("NotoSansRegular", regularFont);
  doc.registerFont("NotoSansBold", boldFont);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let y = PAGE.margin;
  const isSummary = "type" in data && data.type === "summary";

  // ---- Title ----
  doc.font("NotoSansBold").fontSize(18).fillColor(COLORS.dark)
    .text(isSummary ? "上級 要約添削レポート" : "上級ライティング添削レポート", PAGE.margin, y);
  y += 28;

  // ---- Meta ----
  doc.font("NotoSansRegular").fontSize(9).fillColor(COLORS.gray);
  doc.text(`生徒名: ${data.student_name}`, PAGE.margin, y);
  y += 14;
  if (data.date) {
    doc.text(`日付: ${data.date}`, PAGE.margin, y);
    y += 14;
  }
  doc.text(`語数: ${data.word_count}`, PAGE.margin, y);
  y += 14;

  if (!isSummary && "topic" in data && data.topic) {
    doc.text(`TOPIC: ${data.topic}`, PAGE.margin, y, { width: PAGE.contentWidth });
    y += doc.heightOfString(data.topic, { width: PAGE.contentWidth }) + 6;
  }

  y = drawLine(doc, y + 4);

  // ---- Scores ----
  const total = data.scores.content + data.scores.organization + data.scores.vocabulary + data.scores.grammar;

  // Score badge
  const badgeW = 100;
  const badgeH = 36;
  doc.roundedRect(PAGE.margin, y, badgeW, badgeH, 6).fill(COLORS.primary);
  doc.font("NotoSansBold").fontSize(22).fillColor(COLORS.white)
    .text(String(total), PAGE.margin, y + 6, { width: badgeW - 40, align: "center" });
  doc.font("NotoSansRegular").fontSize(11).fillColor(COLORS.white)
    .text("/ 16", PAGE.margin + badgeW - 48, y + 12);
  y += badgeH + 12;

  // Score table
  const scoreLabels = isSummary
    ? ["内容", "構成", "語彙", "言語"]
    : ["内容 (Content)", "構成 (Organization)", "語彙 (Vocabulary)", "文法 (Grammar)"];

  y = drawTable(doc, y, [
    { header: "観点", width: 240 },
    { header: "スコア", width: 120, align: "center" },
    { header: "満点", width: 120, align: "center" },
  ], [
    [scoreLabels[0], String(data.scores.content), "4"],
    [scoreLabels[1], String(data.scores.organization), "4"],
    [scoreLabels[2], String(data.scores.vocabulary), "4"],
    [scoreLabels[3], String(data.scores.grammar), "4"],
  ]);

  // ---- Good Points (summary only) ----
  if (isSummary && (data as SummaryPdfInput).good_points?.length) {
    y = drawSectionTitle(doc, "良い点", y);
    const gp = (data as SummaryPdfInput).good_points!;
    for (const point of gp) {
      y = checkPageBreak(doc, y, 16);
      doc.font("NotoSansRegular").fontSize(9).fillColor(COLORS.green).text("✓ ", PAGE.margin, y, { continued: true });
      doc.fillColor(COLORS.dark).text(point, { width: PAGE.contentWidth - 12 });
      y += doc.heightOfString(point, { width: PAGE.contentWidth - 12 }) + 4;
    }
    y += 6;
  }

  // ---- Errors ----
  if (data.errors.length > 0) {
    y = drawSectionTitle(doc, `エラーリスト（${data.errors.length}件）`, y);

    const hasExplanation = isSummary && data.errors.some((e) => "explanation" in e && e.explanation);
    const errorColumns: TableColumn[] = hasExplanation
      ? [
          { header: "#", width: 30, align: "center" },
          { header: "タイプ", width: 60 },
          { header: "原文", width: 130 },
          { header: "修正案", width: 130 },
          { header: "説明", width: 145 },
        ]
      : [
          { header: "#", width: 30, align: "center" },
          { header: "タイプ", width: 70 },
          { header: "原文", width: 180 },
          { header: "修正案", width: 215 },
        ];

    const errorRows = data.errors.map((e) => {
      const row = [String(e.id), e.type, e.original, e.correction];
      if (hasExplanation) row.push("explanation" in e ? (e.explanation as string) || "" : "");
      return row;
    });

    y = drawTable(doc, y, errorColumns, errorRows, { headerBg: COLORS.dark });
  }

  // ---- Content Analysis (summary only) ----
  if (isSummary && (data as SummaryPdfInput).content_analysis) {
    const ca = (data as SummaryPdfInput).content_analysis!;
    y = drawSectionTitle(doc, "内容分析", y);

    const sections = [
      { label: "キーポイントのカバー率", text: ca.key_points_coverage, color: COLORS.primary },
      { label: "不要な内容", text: ca.unnecessary_content, color: COLORS.orange },
      { label: "構成上の問題", text: ca.structure_issues, color: COLORS.red },
    ];

    for (const sec of sections) {
      if (!sec.text) continue;
      y = checkPageBreak(doc, y, 40);
      // Left border accent
      doc.rect(PAGE.margin, y, 3, 16).fill(sec.color);
      doc.font("NotoSansBold").fontSize(9).fillColor(COLORS.dark)
        .text(sec.label, PAGE.margin + 10, y + 2);
      y += 18;
      doc.font("NotoSansRegular").fontSize(8.5).fillColor(COLORS.gray)
        .text(sec.text, PAGE.margin + 10, y, { width: PAGE.contentWidth - 10 });
      y += doc.heightOfString(sec.text, { width: PAGE.contentWidth - 10 }) + 8;
    }
  }

  // ---- Vocabulary Suggestions (summary only) ----
  if (isSummary && (data as SummaryPdfInput).vocabulary_suggestions?.length) {
    const vs = (data as SummaryPdfInput).vocabulary_suggestions!;
    y = drawSectionTitle(doc, "語彙の改善提案", y);
    y = drawTable(doc, y, [
      { header: "原文", width: 165 },
      { header: "提案", width: 165 },
      { header: "理由", width: 165 },
    ], vs.map((v) => [v.original, v.suggested, v.reason]));
  }

  // ---- Feedback ----
  y = drawSectionTitle(doc, "4観点別 講評", y);
  const fbSections = [
    { label: "内容", text: data.feedback.content, color: COLORS.primary },
    { label: "構成", text: data.feedback.organization, color: COLORS.teal },
    { label: "語彙", text: data.feedback.vocabulary, color: COLORS.orange },
    { label: isSummary ? "言語" : "文法", text: data.feedback.grammar, color: COLORS.pink },
  ];

  for (const sec of fbSections) {
    y = checkPageBreak(doc, y, 50);
    // Card background
    const textH = doc.font("NotoSansRegular").fontSize(8.5)
      .heightOfString(sec.text, { width: PAGE.contentWidth - 20 });
    const cardH = textH + 28;
    doc.roundedRect(PAGE.margin, y, PAGE.contentWidth, cardH, 4).fill("#FBFBFA");
    doc.rect(PAGE.margin, y, 3, cardH).fill(sec.color);

    doc.font("NotoSansBold").fontSize(9.5).fillColor(COLORS.dark)
      .text(sec.label, PAGE.margin + 12, y + 6);
    doc.font("NotoSansRegular").fontSize(8.5).fillColor(COLORS.gray)
      .text(sec.text, PAGE.margin + 12, y + 20, { width: PAGE.contentWidth - 24 });
    y += cardH + 6;
  }

  // ---- Model Essay ----
  y = drawSectionTitle(doc, "模範答案", y);
  y = checkPageBreak(doc, y, 60);
  const essayH = doc.font("NotoSansRegular").fontSize(9)
    .heightOfString(data.model_essay, { width: PAGE.contentWidth - 20 });
  const boxH = essayH + 16;

  // May need multiple pages for long essays
  doc.roundedRect(PAGE.margin, y, PAGE.contentWidth, Math.min(boxH, PAGE.bottomLimit - y), 4)
    .fill("#F3E8FF");
  doc.font("NotoSansRegular").fontSize(9).fillColor(COLORS.dark)
    .text(data.model_essay, PAGE.margin + 10, y + 8, { width: PAGE.contentWidth - 20 });
  y += boxH + 10;

  // ---- Advice ----
  if (data.advice.length > 0) {
    y = drawSectionTitle(doc, "学習アドバイス", y);

    for (const item of data.advice) {
      y = checkPageBreak(doc, y, 40);
      const priorityLabel = item.priority === "high" ? "高" : item.priority === "medium" ? "中" : "低";
      const priorityColor = item.priority === "high" ? COLORS.red : item.priority === "medium" ? COLORS.orange : COLORS.green;

      // Priority badge
      doc.roundedRect(PAGE.margin, y, 24, 14, 3).fill(priorityColor);
      doc.font("NotoSansBold").fontSize(7).fillColor(COLORS.white)
        .text(priorityLabel, PAGE.margin + 2, y + 3, { width: 20, align: "center" });

      doc.font("NotoSansBold").fontSize(9.5).fillColor(COLORS.dark)
        .text(item.title, PAGE.margin + 30, y + 1);
      y += 18;

      doc.font("NotoSansRegular").fontSize(8.5).fillColor(COLORS.gray)
        .text(item.body, PAGE.margin + 4, y, { width: PAGE.contentWidth - 4 });
      y += doc.heightOfString(item.body, { width: PAGE.contentWidth - 4 }) + 10;
    }
  }

  // ---- Original Text ----
  y = drawSectionTitle(doc, "原文", y);
  y = checkPageBreak(doc, y, 40);
  doc.font("NotoSansRegular").fontSize(8.5).fillColor(COLORS.dark)
    .text(data.original_text, PAGE.margin, y, { width: PAGE.contentWidth });

  // ---- Footer on every page ----
  const pageCount = doc.bufferedPageRange();
  const totalPages = pageCount.start + pageCount.count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.font("NotoSansRegular").fontSize(7).fillColor(COLORS.lightGray)
      .text(
        `上級 添削レポート — Page ${i + 1} / ${totalPages}`,
        PAGE.margin,
        PAGE.height - 35,
        { width: PAGE.contentWidth, align: "center" }
      );
  }

  doc.end();
  return finished;
}
