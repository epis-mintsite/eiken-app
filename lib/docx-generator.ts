import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
} from "docx";

export interface DocxInput {
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

const SCORE_LABELS: { key: keyof DocxInput["scores"]; label: string }[] = [
  { key: "content", label: "内容" },
  { key: "organization", label: "構成" },
  { key: "vocabulary", label: "語彙" },
  { key: "grammar", label: "文法" },
];

const FEEDBACK_LABELS: { key: keyof DocxInput["feedback"]; label: string }[] = [
  { key: "content", label: "内容" },
  { key: "organization", label: "構成" },
  { key: "vocabulary", label: "語彙" },
  { key: "grammar", label: "文法" },
];

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  };
}

function thinBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };
}

export async function generateDocx(data: DocxInput): Promise<Buffer> {
  const total =
    data.scores.content +
    data.scores.organization +
    data.scores.vocabulary +
    data.scores.grammar;

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "英検準一級 ライティング添削レポート", bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    })
  );

  // Meta
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${data.student_name} — ${data.topic}`, color: "666666", size: 22 }),
      ],
      spacing: { after: 300 },
    })
  );

  // Original text section
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "原文（OCR結果）", bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    })
  );
  for (const line of data.original_text.split("\n")) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 60 },
      })
    );
  }

  // Scores section
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "採点結果 — ", bold: true, size: 26 }),
        new TextRun({ text: `${total} / 16`, bold: true, size: 28, color: "2563EB" }),
        new TextRun({ text: `（語数: ${data.word_count}）`, size: 22, color: "666666" }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );

  const scoreRows = SCORE_LABELS.map(
    ({ key, label }) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, size: 22 })] })],
            borders: thinBorder(),
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${data.scores[key]} / 4`, bold: true, size: 22 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            borders: thinBorder(),
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
        ],
      })
  );
  children.push(
    new Table({
      rows: scoreRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  // Errors section
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `エラーリスト（${data.errors.length}件）`, bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );

  if (data.errors.length > 0) {
    const headerRow = new TableRow({
      children: ["#", "タイプ", "原文", "修正案"].map(
        (text) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text, bold: true, size: 20, color: "666666" })],
              }),
            ],
            borders: thinBorder(),
          })
      ),
    });

    const errorDataRows = data.errors.map(
      (err) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${err.id}`, size: 20 })] })],
              borders: thinBorder(),
              width: { size: 8, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: err.type, size: 20 })] })],
              borders: thinBorder(),
              width: { size: 17, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: err.original, size: 20, color: "DC2626", strike: true })],
                }),
              ],
              borders: thinBorder(),
              width: { size: 37, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: err.correction, size: 20, color: "16A34A", bold: true })],
                }),
              ],
              borders: thinBorder(),
              width: { size: 38, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    );

    children.push(
      new Table({
        rows: [headerRow, ...errorDataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  // Feedback section
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "4観点別 講評", bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );
  for (const { key, label } of FEEDBACK_LABELS) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `■ ${label}`, bold: true, size: 22 })],
        spacing: { before: 150, after: 60 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.feedback[key], size: 22, color: "4B5563" })],
        spacing: { after: 80 },
      })
    );
  }

  // Model essay
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "模範答案", bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );
  for (const line of data.model_essay.split("\n")) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 60 },
      })
    );
  }

  // Advice
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "学習アドバイス", bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );
  const priorityLabel: Record<string, string> = { high: "高", medium: "中", low: "低" };
  for (const item of data.advice) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `【優先度: ${priorityLabel[item.priority] || "中"}】`, bold: true, size: 20, color: "666666" }),
          new TextRun({ text: ` ${item.title}`, bold: true, size: 22 }),
        ],
        spacing: { before: 120, after: 40 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: item.body, size: 22, color: "4B5563" })],
        spacing: { after: 80 },
      })
    );
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "英検準一級 ライティング添削アプリ — 自動生成レポート",
          size: 18,
          color: "9CA3AF",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
