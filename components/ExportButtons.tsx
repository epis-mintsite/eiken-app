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

export default function ExportButtons({ data }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState("");

  async function downloadFile(
    endpoint: string,
    filename: string,
    setLoading: (v: boolean) => void
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">レポート出力</h2>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() =>
            downloadFile("/api/export/pdf", `eiken_report_${Date.now()}.pdf`, setPdfLoading)
          }
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
          onClick={() =>
            downloadFile("/api/export/docx", `eiken_report_${Date.now()}.docx`, setDocxLoading)
          }
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
