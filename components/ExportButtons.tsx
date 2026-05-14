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

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildPrintHtml(data: ExportData): string {
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
<title>添削レポート - ${escapeHtml(data.student_name)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', Meiryo, sans-serif; color: #37352F; font-size: 11px; line-height: 1.65; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 21px; font-weight: 700; margin-bottom: 6px; }
  h2 { font-size: 15px; font-weight: 600; margin: 22px 0 10px; border-bottom: 2px solid #E3E2DE; padding-bottom: 5px; }
  .meta { color: #6B6B6B; font-size: 12px; margin-bottom: 3px; }
  .score-box { display: inline-block; background: #6C5CE7; color: #fff; font-size: 26px; font-weight: 700; padding: 6px 22px; border-radius: 8px; margin: 6px 0 12px; }
  .score-box span { font-size: 15px; font-weight: 400; opacity: .8; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; }
  th { background: #6C5CE7; color: #fff; text-align: left; padding: 7px 12px; font-size: 11px; font-weight: 600; }
  .err-th { background: #37352F; }
  td { padding: 6px 12px; border-bottom: 1px solid #EEEEEC; font-size: 11px; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #fff; }
  .fb { background: #F7F6F3; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
  .fb-content { border-left: 4px solid #6C5CE7; }
  .fb-org { border-left: 4px solid #4DB6AC; }
  .fb-vocab { border-left: 4px solid #FF8C42; }
  .fb-grammar { border-left: 4px solid #E255A1; }
  .fb strong { display: block; margin-bottom: 3px; font-size: 12px; }
  .model { background: #F3E8FF; border: 1px solid rgba(108,92,231,.2); border-radius: 6px; padding: 12px 14px; white-space: pre-wrap; line-height: 1.75; }
  .advice-item { border: 1px solid #EEEEEC; border-radius: 6px; padding: 9px 12px; margin-bottom: 7px; }
  .original { background: #FBFBFA; border-radius: 6px; padding: 12px 14px; white-space: pre-wrap; line-height: 1.75; }
  .correction { color: #4CAF50; font-weight: 500; }
  .strike { color: #EB5757; text-decoration: line-through; }
  .footer { text-align: center; color: #9B9A97; font-size: 9px; margin-top: 28px; padding-top: 10px; border-top: 1px solid #EEEEEC; }
</style>
</head>
<body>
<h1>英検準一級 ライティング添削レポート</h1>
<p class="meta">生徒名: ${escapeHtml(data.student_name)}</p>
<p class="meta">語数: ${data.word_count}</p>
<p class="meta">TOPIC: ${escapeHtml(data.topic)}</p>

<h2>採点結果</h2>
<div class="score-box">${total} <span>/ 16</span></div>
<table>
<tr><th>観点</th><th style="text-align:center">スコア</th><th style="text-align:center">満点</th></tr>
<tr><td>内容 (Content)</td><td style="text-align:center;font-weight:600">${data.scores.content}</td><td style="text-align:center">4</td></tr>
<tr><td>構成 (Organization)</td><td style="text-align:center;font-weight:600">${data.scores.organization}</td><td style="text-align:center">4</td></tr>
<tr><td>語彙 (Vocabulary)</td><td style="text-align:center;font-weight:600">${data.scores.vocabulary}</td><td style="text-align:center">4</td></tr>
<tr><td>文法 (Grammar)</td><td style="text-align:center;font-weight:600">${data.scores.grammar}</td><td style="text-align:center">4</td></tr>
</table>

${data.errors.length > 0 ? `
<h2>エラーリスト（${data.errors.length}件）</h2>
<table>
<tr><th class="err-th">#</th><th class="err-th">タイプ</th><th class="err-th">原文</th><th class="err-th">修正案</th></tr>
${data.errors.map(e => `<tr><td>${e.id}</td><td><span class="badge" style="background:${typeColor(e.type)}">${escapeHtml(e.type)}</span></td><td class="strike">${escapeHtml(e.original)}</td><td class="correction">${escapeHtml(e.correction)}</td></tr>`).join("")}
</table>` : ""}

<h2>4観点別 講評</h2>
<div class="fb fb-content"><strong>内容</strong>${escapeHtml(data.feedback.content)}</div>
<div class="fb fb-org"><strong>構成</strong>${escapeHtml(data.feedback.organization)}</div>
<div class="fb fb-vocab"><strong>語彙</strong>${escapeHtml(data.feedback.vocabulary)}</div>
<div class="fb fb-grammar"><strong>文法</strong>${escapeHtml(data.feedback.grammar)}</div>

<h2>模範答案</h2>
<div class="model">${escapeHtml(data.model_essay)}</div>

${data.advice.length > 0 ? `
<h2>学習アドバイス</h2>
${data.advice.map(a => `<div class="advice-item"><span class="badge" style="background:${priorityColor(a.priority)}">優先度: ${priorityLabel(a.priority)}</span> <strong style="display:inline;margin-left:6px">${escapeHtml(a.title)}</strong><p style="margin:4px 0 0">${escapeHtml(a.body)}</p></div>`).join("")}` : ""}

<h2>原文</h2>
<div class="original">${escapeHtml(data.original_text)}</div>

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
      const html = buildPrintHtml(data);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。");
      }
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setPdfLoading(false);
        }, 300);
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
        PDF: 印刷ダイアログで「PDFとして保存」を選択してください
      </p>
      {error && (
        <p className="mt-3 text-sm text-[#EB5757]">{error}</p>
      )}
    </div>
  );
}
