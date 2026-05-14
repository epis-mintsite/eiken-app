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

function buildPdfHtml(data: ExportData): string {
  const total = data.scores.content + data.scores.organization + data.scores.vocabulary + data.scores.grammar;
  const priorityLabel = (p: string) => p === "high" ? "高" : p === "medium" ? "中" : "低";
  const priorityColor = (p: string) => p === "high" ? "#E255A1" : p === "medium" ? "#FF9800" : "#4CAF50";
  const typeColor = (t: string) => {
    const map: Record<string, string> = { grammar: "#E255A1", vocabulary: "#6C5CE7", spelling: "#FF8C42", punctuation: "#8D6E63", style: "#2383E2" };
    return map[t] || "#6B6B6B";
  };

  return `
<div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; color: #37352F; font-size: 12px; line-height: 1.6; padding: 10px;">
  <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #37352F;">英検準一級 ライティング添削レポート</h1>
  <p style="color: #6B6B6B; font-size: 13px; margin: 2px 0;">生徒名: ${escapeHtml(data.student_name)}</p>
  <p style="color: #6B6B6B; font-size: 13px; margin: 2px 0;">語数: ${data.word_count}</p>
  <p style="color: #6B6B6B; font-size: 13px; margin: 2px 0 16px;">TOPIC: ${escapeHtml(data.topic)}</p>

  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">採点結果</h2>
  <div style="display: inline-block; background: #6C5CE7; color: white; font-size: 28px; font-weight: 700; padding: 8px 24px; border-radius: 8px; margin: 4px 0 14px;">
    ${total} <span style="font-size: 16px; font-weight: 400; opacity: 0.8;">/ 16</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px;">
    <tr><th style="background: #6C5CE7; color: white; text-align: left; padding: 8px 14px; font-size: 12px;">観点</th><th style="background: #6C5CE7; color: white; text-align: center; padding: 8px 14px; font-size: 12px;">スコア</th><th style="background: #6C5CE7; color: white; text-align: center; padding: 8px 14px; font-size: 12px;">満点</th></tr>
    <tr><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC;">内容 (Content)</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center; font-weight: 600;">${data.scores.content}</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center;">4</td></tr>
    <tr><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC;">構成 (Organization)</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center; font-weight: 600;">${data.scores.organization}</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center;">4</td></tr>
    <tr><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC;">語彙 (Vocabulary)</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center; font-weight: 600;">${data.scores.vocabulary}</td><td style="padding: 8px 14px; border-bottom: 1px solid #EEEEEC; text-align: center;">4</td></tr>
    <tr><td style="padding: 8px 14px;">文法 (Grammar)</td><td style="padding: 8px 14px; text-align: center; font-weight: 600;">${data.scores.grammar}</td><td style="padding: 8px 14px; text-align: center;">4</td></tr>
  </table>

  ${data.errors.length > 0 ? `
  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">エラーリスト（${data.errors.length}件）</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px;">
    <tr><th style="background: #37352F; color: white; text-align: left; padding: 8px 12px; font-size: 11px;">#</th><th style="background: #37352F; color: white; text-align: left; padding: 8px 12px; font-size: 11px;">タイプ</th><th style="background: #37352F; color: white; text-align: left; padding: 8px 12px; font-size: 11px;">原文</th><th style="background: #37352F; color: white; text-align: left; padding: 8px 12px; font-size: 11px;">修正案</th></tr>
    ${data.errors.map(e => `<tr><td style="padding: 7px 12px; border-bottom: 1px solid #EEEEEC;">${e.id}</td><td style="padding: 7px 12px; border-bottom: 1px solid #EEEEEC;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; background: ${typeColor(e.type)};">${escapeHtml(e.type)}</span></td><td style="padding: 7px 12px; border-bottom: 1px solid #EEEEEC; color: #EB5757; text-decoration: line-through;">${escapeHtml(e.original)}</td><td style="padding: 7px 12px; border-bottom: 1px solid #EEEEEC; color: #4CAF50; font-weight: 500;">${escapeHtml(e.correction)}</td></tr>`).join("")}
  </table>` : ""}

  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">4観点別 講評</h2>
  <div style="background: #F7F6F3; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid #6C5CE7;"><strong>内容</strong><p style="margin: 4px 0 0;">${escapeHtml(data.feedback.content)}</p></div>
  <div style="background: #F7F6F3; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid #4DB6AC;"><strong>構成</strong><p style="margin: 4px 0 0;">${escapeHtml(data.feedback.organization)}</p></div>
  <div style="background: #F7F6F3; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid #FF8C42;"><strong>語彙</strong><p style="margin: 4px 0 0;">${escapeHtml(data.feedback.vocabulary)}</p></div>
  <div style="background: #F7F6F3; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid #E255A1;"><strong>文法</strong><p style="margin: 4px 0 0;">${escapeHtml(data.feedback.grammar)}</p></div>

  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">模範答案</h2>
  <div style="background: #F3E8FF; border: 1px solid rgba(108,92,231,0.2); border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; font-size: 12px; line-height: 1.7;">${escapeHtml(data.model_essay)}</div>

  ${data.advice.length > 0 ? `
  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">学習アドバイス</h2>
  ${data.advice.map(a => `<div style="border: 1px solid #EEEEEC; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; background: ${priorityColor(a.priority)};">優先度: ${priorityLabel(a.priority)}</span> <strong>${escapeHtml(a.title)}</strong><p style="margin: 4px 0 0;">${escapeHtml(a.body)}</p></div>`).join("")}` : ""}

  <h2 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #37352F; border-bottom: 2px solid #E3E2DE; padding-bottom: 6px;">原文</h2>
  <div style="background: #FBFBFA; border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; font-size: 12px; line-height: 1.7;">${escapeHtml(data.original_text)}</div>

  <div style="text-align: center; color: #9B9A97; font-size: 10px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #EEEEEC;">英検準一級 ライティング添削レポート — 自動生成</div>
</div>`;
}

export default function ExportButtons({ data }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePdfDownload() {
    setPdfLoading(true);
    setError("");
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const container = document.createElement("div");
      container.innerHTML = buildPdfHtml(data);
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "210mm";
      container.style.zIndex = "-1";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.background = "white";
      document.body.appendChild(container);

      // Wait for rendering
      await new Promise((r) => setTimeout(r, 100));

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `eiken_report_${data.student_name}_${Date.now()}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF生成に失敗しました");
    } finally {
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
      {error && (
        <p className="mt-3 text-sm text-[#EB5757]">{error}</p>
      )}
    </div>
  );
}
