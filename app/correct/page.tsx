"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";
import { compressImage } from "@/lib/image-compress";

type TabType = "writing" | "summary";

function CorrectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "summary" ? "summary" : "writing";
  const [tab, setTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "summary" || t === "writing") {
      setTab(t);
    }
  }, [searchParams]);

  // Writing state
  const [file, setFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Summary state
  const [passageFile, setPassageFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [summaryStudentName, setSummaryStudentName] = useState("");
  const [summaryDate, setSummaryDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Shared state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);

  const canSubmitWriting = file && studentName.trim() && topic.trim() && !loading;
  const canSubmitSummary = passageFile && answerFile && !loading;
  const canSubmit = tab === "writing" ? canSubmitWriting : canSubmitSummary;

  function resetState() {
    setLoading(false);
    setProgress("");
    setStreamText("");
    setError("");
  }

  function handleTabChange(newTab: TabType) {
    if (loading) return;
    resetState();
    setTab(newTab);
  }

  // --- Writing submission ---
  async function handleWritingSubmit() {
    if (!file || !studentName.trim() || !topic.trim()) return;

    setProgress("画像を圧縮中...");
    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append("image", compressed);
    formData.append("studentName", studentName);
    formData.append("topic", topic);
    formData.append("date", date);

    try {
      const stored = localStorage.getItem("eikenSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.strictness) formData.append("strictness", settings.strictness);
        if (settings.customInstructions)
          formData.append("customInstructions", settings.customInstructions);
      }
    } catch {
      // skip
    }

    if (useStreaming) {
      const res = await fetch("/api/correct-stream", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("添削処理に失敗しました");
      await processSSE(res, "writing");
    } else {
      setProgress("OCR処理中... 手書き文字を読み取っています");
      const res = await fetch("/api/correct", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "添削処理に失敗しました");
      }
      const data = await res.json();
      sessionStorage.setItem("correctionResult", JSON.stringify(data));
      router.push(data.id ? `/result/${data.id}` : "/result/local");
    }
  }

  // --- Summary submission ---
  async function handleSummarySubmit() {
    if (!passageFile || !answerFile) return;

    setProgress("画像を圧縮中...");
    const [compressedPassage, compressedAnswer] = await Promise.all([
      compressImage(passageFile),
      compressImage(answerFile),
    ]);

    const formData = new FormData();
    formData.append("passageImage", compressedPassage);
    formData.append("answerImage", compressedAnswer);
    formData.append("studentName", summaryStudentName);
    formData.append("date", summaryDate);

    try {
      const stored = localStorage.getItem("eikenSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.strictness) formData.append("strictness", settings.strictness);
        if (settings.customInstructions)
          formData.append("customInstructions", settings.customInstructions);
      }
    } catch {
      // skip
    }

    const res = await fetch("/api/summary-stream", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let msg = "添削処理に失敗しました";
      try {
        const body = await res.json();
        if (body.error) msg = body.error;
      } catch {
        if (res.status === 413) msg = "画像サイズが大きすぎます。より小さい画像を使用してください。";
      }
      throw new Error(msg);
    }
    await processSSE(res, "summary");
  }

  // --- SSE processing ---
  async function processSSE(res: Response, type: "writing" | "summary") {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("ストリーミングに対応していません");

    const decoder = new TextDecoder();
    let buffer = "";
    let eventType = "";
    let sawResult = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          handleSSEEvent(eventType, data, type);
          if (eventType === "result") sawResult = true;
        }
      }
    }

    if (!sawResult) {
      throw new TypeError("通信が中断されました");
    }
  }

  function handleSSEEvent(
    event: string,
    data: Record<string, unknown>,
    type: "writing" | "summary"
  ) {
    switch (event) {
      case "status":
        setProgress(data.message as string);
        break;
      case "ocr":
        setProgress("OCR完了。添削を開始...");
        break;
      case "delta":
        setStreamText((prev) => prev + (data.text as string));
        break;
      case "result":
        setProgress("添削完了！結果を表示します...");
        if (type === "summary") {
          sessionStorage.setItem("summaryResult", JSON.stringify(data));
          router.push(
            data.id ? `/summary-result/${data.id}` : "/summary-result/local"
          );
        } else {
          sessionStorage.setItem("correctionResult", JSON.stringify(data));
          router.push(data.id ? `/result/${data.id}` : "/result/local");
        }
        break;
      case "error":
        throw new Error(data.message as string);
    }
  }

  async function fetchLatestCorrectedAt(): Promise<string> {
    try {
      const res = await fetch("/api/history?limit=1");
      if (!res.ok) return "";
      const data = await res.json();
      return data.corrections?.[0]?.corrected_at || "";
    } catch {
      return "";
    }
  }

  async function recoverAfterConnectionLoss(
    type: TabType,
    sinceCorrectedAt: string
  ): Promise<boolean> {
    setProgress(
      "通信が中断されましたが、添削処理はサーバーで継続しています。完了を確認しています..."
    );
    const deadline = Date.now() + 150000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch("/api/history?limit=5");
        if (!res.ok) continue;
        const data = await res.json();
        const rec = (data.corrections || []).find(
          (c: { id: string; type?: string; corrected_at: string }) =>
            (c.type === "summary" ? "summary" : "writing") === type &&
            (!sinceCorrectedAt || c.corrected_at > sinceCorrectedAt)
        );
        if (rec) {
          router.push(
            type === "summary" ? `/summary-result/${rec.id}` : `/result/${rec.id}`
          );
          return true;
        }
      } catch {
        // 接続の回復を待って次のポーリングへ
      }
    }
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setProgress("処理を開始...");
    setStreamText("");

    const sinceCorrectedAt = await fetchLatestCorrectedAt();

    try {
      if (tab === "writing") {
        await handleWritingSubmit();
      } else {
        await handleSummarySubmit();
      }
    } catch (err) {
      // 通信切断時はサーバー側で処理が完了している可能性があるため検知を試みる
      const recovered =
        err instanceof TypeError &&
        (await recoverAfterConnectionLoss(tab, sinceCorrectedAt));
      if (!recovered) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F]">
            新規添削
          </h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            ライティングまたは要約問題の添削を実行
          </p>
        </div>

        {/* Tab */}
        <div className="flex border-b border-[#E3E2DE] mb-6">
          <button
            onClick={() => handleTabChange("writing")}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              tab === "writing"
                ? "text-[#37352F]"
                : "text-[#9B9A97] hover:text-[#37352F]"
            }`}
          >
            ライティング添削
            {tab === "writing" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("summary")}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              tab === "summary"
                ? "text-[#37352F]"
                : "text-[#9B9A97] hover:text-[#37352F]"
            }`}
          >
            要約添削
            {tab === "summary" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#37352F]" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {tab === "writing" ? (
            <>
              {/* Writing form */}
              <UploadDropzone file={file} onFileSelect={setFile} />

              <div className="bg-white rounded-xl border border-[#E3E2DE] p-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    生徒名 <span className="text-[#EB5757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="山田太郎"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    TOPIC <span className="text-[#EB5757]">*</span>
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Agree or disagree: Technology has made our lives more convenient."
                    rows={3}
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    日付
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Summary form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-2">
                    課題文の写真 <span className="text-[#EB5757]">*</span>
                  </label>
                  <UploadDropzone
                    file={passageFile}
                    onFileSelect={setPassageFile}
                    label="課題文（英文パッセージ）の写真をドラッグ＆ドロップ"
                    description="またはクリックしてファイルを選択（JPG / PNG / WebP、最大10MB）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-2">
                    生徒の解答の写真 <span className="text-[#EB5757]">*</span>
                  </label>
                  <UploadDropzone
                    file={answerFile}
                    onFileSelect={setAnswerFile}
                    label="生徒の解答（要約文）の写真をドラッグ＆ドロップ"
                    description="またはクリックしてファイルを選択（JPG / PNG / WebP、最大10MB）"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E3E2DE] p-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    生徒名（任意）
                  </label>
                  <input
                    type="text"
                    value={summaryStudentName}
                    onChange={(e) => setSummaryStudentName(e.target.value)}
                    placeholder="山田太郎"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    日付
                  </label>
                  <input
                    type="date"
                    value={summaryDate}
                    onChange={(e) => setSummaryDate(e.target.value)}
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Shared options */}
          <label className="flex items-center gap-2.5 text-sm text-[#37352F] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded accent-[#6C5CE7] w-4 h-4"
            />
            リアルタイム表示（ストリーミング）
          </label>

          {error && (
            <div className="bg-[#FFF3E8] border border-[#EB5757]/30 text-[#EB5757] rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {loading && streamText && (
            <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
              <h3 className="text-sm font-medium text-[#6B6B6B] mb-3">
                添削結果（リアルタイム）
              </h3>
              <pre className="text-xs text-[#37352F] whitespace-pre-wrap max-h-60 overflow-y-auto bg-[#FBFBFA] border border-[#E3E2DE] rounded-lg p-4 font-mono leading-relaxed">
                {streamText}
              </pre>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-lg font-medium text-sm text-white transition-colors ${
              canSubmit
                ? "bg-[#6C5CE7] hover:bg-[#5A4BD1]"
                : "bg-[#CFCDC9] cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {progress}
              </span>
            ) : tab === "writing" ? (
              "添削を開始"
            ) : (
              "要約を添削する"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CorrectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#6C5CE7] border-t-transparent rounded-full" />
        </div>
      }
    >
      <CorrectPageInner />
    </Suspense>
  );
}
