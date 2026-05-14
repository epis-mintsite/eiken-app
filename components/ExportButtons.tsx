"use client";

import { useState } from "react";

interface ExportData {
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

interface Props {
  data: ExportData;
}

function buildPdfHtml(data: ExportData): string {
  const total = data.scores.content + data.scores.organization + data.scores.vocabulary + data.scores.grammar;
  const priorityLabel = (p: string) => p === "high" ? "高" : p === "medium" ? "中" : "低";
  const priorityColor = (p: string) => p === "high" ? "#E255A1" : p === "medium" ? "#FF9800" : "#4CAF50";
  const typeColor = (t: string) => {
    const map: Record<string, string> = { grammar: "#E255A1", vocabulary: "#6C5CE7", spelling: "#FF8C42", punctuation: "#8D6E63", style: "#2383E2" };
    return map[t] || "#6B6B6B";
  };

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>英検準一級 ライティング添削レポート - ${data.student_name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; color: #37352F; font-size: 11px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #37352F; }
  h2 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px; }
  h3 { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .meta { color: #6B6B6B; font-size: 12px; margin-bottom: 4px; }
  .score-box { display: inline-block; background: #6C5CE7; color: white; font-size: 28px; font-weight: 700; padding: 8px 20px; border-radius: 8px; margin: 8px 0 16px; }
  .score-max { font-size: 16px; font-weight: 400; opacity: 0.8; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  th { background: #37352F; color: white; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; }
  td { padding: 7px 12px; border-bottom: 1px solid #EEEEEC; font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  .score-table th { background: #6C5CE7; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; }
  .feedback-section { background: #F7F6F3; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid; }
  .model-essay { background: #F3E8FF; border: 1px solid rgba(108,92,231,0.2); border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; font-size: 11px; line-height: 1.7; }
  .advice-item { border: 1px solid #EEEEEC; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; }
  .original-text { background: #FBFBFA; border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; font-size: 11px; line-height: 1.7; }
  .correction { color: #4CAF50; font-weight: 500; }
  .original-err { color: #EB5757; text-decoration: line-through; }
  .footer { text-align: center; color: #9B9A97; font-size: 9px; margin-top: 32px; padding-top: 12px; border-top: 1px solid #EEEEEC; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<h1>英検準一級 ライティング添削レポート</h1>
<p class="meta">生徒名: ${data.student_name}</p>
<p class="meta">語数: ${data.word_count}</p>
<p class="meta">TOPIC: ${data.topic}</p>

<h2>採点結果</h2>
<div class="score-box">${total} <span class="score-max">/ 16</span></div>
<table class="score-table">
<tr><th>観点</th><th>スコア</th><th>満点</th></tr>
<tr><td>内容 (Content)</td><td>${data.scores.content}</td><td>4</td></tr>
<tr><td>構成 (Organization)</td><td>${data.scores.organization}</td><td>4</td></tr>
<tr><td>語彙 (Vocabulary)</td><td>${data.scores.vocabulary}</td><td>4</td></tr>
<tr><td>文法 (Grammar)</td><td>${data.scores.grammar}</td><td>4</td></tr>
</table>

${data.errors.length > 0 ? `
<h2>エラーリスト（${data.errors.length}件）</h2>
<table>
<tr><th>#</th><th>タイプ</th><th>原文</th><th>修正案</th></tr>
${data.errors.map(e => `<tr><td>${e.id}</td><td><span class="badge" style="background:${typeColor(e.type)}">${e.type}</span></td><td class="original-err">${e.original}</td><td class="correction">${e.correction}</td></tr>`).join("")}
</table>` : ""}

<h2>4観点別 講評</h2>
<div class="feedback-section" style="border-color:#6C5CE7"><h3>内容</h3><p>${data.feedback.content}</p></div>
<div class="feedback-section" style="border-color:#4DB6AC"><h3>構成</h3><p>${data.feedback.organization}</p></div>
<div class="feedback-section" style="border-color:#FF8C42"><h3>語彙</h3><p>${data.feedback.vocabulary}</p></div>
<div class="feedback-section" style="border-color:#E255A1"><h3>文法</h3><p>${data.feedback.grammar}</p></div>

<h2>模範答案</h2>
<div class="model-essay">${data.model_essay}</div>

${data.advice.length > 0 ? `
<h2>学習アドバイス</h2>
${data.advice.map(a => `<div class="advice-item"><span class="badge" style="background:${priorityColor(a.priority)}">優先度: ${priorityLabel(a.priority)}</span> <strong>${a.title}</strong><p style="margin-top:4px">${a.body}</p></div>`).join("")}` : ""}

<h2>原文</h2>
<div class="original-text">${data.original_text}</div>

<div class="footer">英検準一級 ライティング添削レポート — 自動生成</div>
</body>
</html>`;
}

export default function ExportButtons({ data }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePdfDownload() {
    setPdfLoading(true);
    setError("");
    try {
      const html = buildPdfHtml(data);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("ポップアップがブロックされました。ポップアップを許可してください。");
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        // Close after a short delay to allow print dialog
        setTimeout(() => {
          setPdfLoading(false);
        }, 1000);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setPdfLoading(false);
    }
  }

  async function downloadDocx() {
    setDocxLoading(true);
    setError("");
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || `ダウンロードに失敗しました (${res.status})`
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eiken_report_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setDocxLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">レポート出力</h2>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePdfDownload}
          disabled={pdfLoading || docxLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#37352F] text-white rounded-lg text-sm font-medium hover:bg-[#2F2E2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pdfLoading ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          PDF ダウンロード
        </button>

        <button
          onClick={downloadDocx}
          disabled={pdfLoading || docxLoading}
          className="flex items-center gap-2 px-5 py-2.5 border border-[#C3C2BF] text-[#37352F] rounded-lg text-sm font-medium hover:bg-[#F7F6F3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {docxLoading ? (
            <span className="animate-spin h-4 w-4 border-2 border-[#37352F] border-t-transparent rounded-full" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Word ダウンロード
        </button>
      </div>
      <p className="mt-3 text-xs text-[#9B9A97]">
        PDF: ブラウザの印刷ダイアログが開きます。「PDFとして保存」を選択してください。
      </p>
      {error && (
        <p className="mt-3 text-sm text-[#EB5757]">{error}</p>
      )}
    </div>
  );
}
