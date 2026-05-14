"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);

  const canSubmit = file && studentName.trim() && topic.trim() && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setProgress("画像をアップロード中...");
    setStreamText("");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("studentName", studentName);
    formData.append("topic", topic);
    formData.append("date", date);

    // 設定を読み込み
    try {
      const stored = localStorage.getItem("eikenSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.strictness) formData.append("strictness", settings.strictness);
        if (settings.customInstructions) formData.append("customInstructions", settings.customInstructions);
      }
    } catch {
      // skip
    }

    try {
      if (useStreaming) {
        await handleStreaming(formData);
      } else {
        await handleNonStreaming(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  async function handleStreaming(formData: FormData) {
    const res = await fetch("/api/correct-stream", { method: "POST", body: formData });
    if (!res.ok) {
      throw new Error("添削処理に失敗しました");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("ストリーミングに対応していません");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          handleSSEEvent(eventType, data);
        }
      }
    }
  }

  function handleSSEEvent(event: string, data: Record<string, unknown>) {
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
        sessionStorage.setItem("correctionResult", JSON.stringify(data));
        if (data.id) {
          router.push(`/result/${data.id}`);
        } else {
          router.push("/result/local");
        }
        break;
      case "error":
        throw new Error(data.message as string);
    }
  }

  async function handleNonStreaming(formData: FormData) {
    setProgress("OCR処理中... 手書き文字を読み取っています");
    const res = await fetch("/api/correct", { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "添削処理に失敗しました");
    }
    setProgress("添削完了！結果を表示します...");
    const data = await res.json();
    sessionStorage.setItem("correctionResult", JSON.stringify(data));
    if (data.id) {
      router.push(`/result/${data.id}`);
    } else {
      router.push("/result/local");
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F]">
            ライティング添削
          </h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            手書き答案の写真をアップロードして自動添削
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="flex items-center gap-2.5 text-sm text-[#37352F] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="rounded accent-[#6C5CE7] w-4 h-4"
              />
              リアルタイム表示（ストリーミング）
            </label>
          </div>

          {error && (
            <div className="bg-[#FFF3E8] border border-[#EB5757]/30 text-[#EB5757] rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {/* Streaming preview */}
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
            ) : (
              "添削を開始"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
