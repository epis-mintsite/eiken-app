import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfInput {
  student_name: string;
  topic: string;
  original_text: string;
  scores: { content: number; organization: number; vocabulary: number; grammar: number };
  errors: { id: number; original: string; type: string; correction: string }[];
  feedback: { content: string; organization: string; vocabulary: string; grammar: string };
  model_essay: string;
  advice: { priority: string; title: string; body: string }[];
  word_count: number;
}


function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function generatePdf(data: PdfInput): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Use Helvetica (built-in, supports ASCII). For Japanese, we'll use Unicode encoding.
  // jsPDF doesn't natively support CJK without font embedding, so we use a workaround.
  doc.setFont("Helvetica");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("Helvetica", "bold");
  doc.text("Eiken Pre-1 Writing Report", margin, y);
  y += 10;

  // Student info
  doc.setFontSize(11);
  doc.setFont("Helvetica", "normal");
  doc.text(`Student: ${data.student_name}`, margin, y);
  y += 6;
  doc.text(`Word Count: ${data.word_count}`, margin, y);
  y += 6;

  // Topic
  doc.setFontSize(10);
  doc.text("Topic:", margin, y);
  y += 5;
  y = addWrappedText(doc, data.topic, margin, y, contentWidth, 5);
  y += 5;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Scores
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  const total = data.scores.content + data.scores.organization + data.scores.vocabulary + data.scores.grammar;
  doc.text(`Total Score: ${total} / 16`, margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Aspect", "Score", "Max"]],
    body: [
      ["Content", String(data.scores.content), "4"],
      ["Organization", String(data.scores.organization), "4"],
      ["Vocabulary", String(data.scores.vocabulary), "4"],
      ["Grammar", String(data.scores.grammar), "4"],
    ],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [108, 92, 231], textColor: 255 },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Errors
  if (data.errors.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text(`Errors (${data.errors.length})`, margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "Type", "Original", "Correction"]],
      body: data.errors.map((e) => [
        String(e.id),
        e.type,
        e.original,
        e.correction,
      ]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [55, 53, 47], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Feedback
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text("Feedback", margin, y);
  y += 8;

  const feedbackSections = [
    { label: "Content", text: data.feedback.content },
    { label: "Organization", text: data.feedback.organization },
    { label: "Vocabulary", text: data.feedback.vocabulary },
    { label: "Grammar", text: data.feedback.grammar },
  ];

  for (const section of feedbackSections) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(section.label, margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    y = addWrappedText(doc, section.text, margin, y, contentWidth, 4.5);
    y += 4;
  }

  // Model Essay
  if (y > 240) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text("Model Essay", margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  y = addWrappedText(doc, data.model_essay, margin, y, contentWidth, 4.5);
  y += 8;

  // Advice
  if (data.advice.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("Study Advice", margin, y);
    y += 8;

    for (const item of data.advice) {
      if (y > 260) { doc.addPage(); y = 20; }
      const priorityLabel = item.priority === "high" ? "[HIGH]" : item.priority === "medium" ? "[MED]" : "[LOW]";
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text(`${priorityLabel} ${item.title}`, margin, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      y = addWrappedText(doc, item.body, margin, y, contentWidth, 4.5);
      y += 4;
    }
  }

  // Original Text
  if (y > 240) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text("Original Text", margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  y = addWrappedText(doc, data.original_text, margin, y, contentWidth, 4.5);

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(150);
    doc.text(
      `Eiken Pre-1 Writing Report - Page ${i}/${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
    doc.setTextColor(0);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Promise.resolve(Buffer.from(arrayBuffer));
}
