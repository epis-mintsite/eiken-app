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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            英検準一級 ライティング添削
          </h1>
          <p className="text-gray-500 mt-1">
            手書き答案の写真をアップロードして自動添削
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <UploadDropzone file={file} onFileSelect={setFile} />

          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生徒名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="山田太郎"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TOPIC <span className="text-red-500">*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Agree or disagree: Technology has made our lives more convenient."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日付
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="rounded"
              />
              リアルタイム表示（ストリーミング）
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {/* Streaming preview */}
          {loading && streamText && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                添削結果（リアルタイム）
              </h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {streamText}
              </pre>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
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
