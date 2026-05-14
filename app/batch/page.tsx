"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

interface BatchItem {
  file: File;
  studentName: string;
  topic: string;
  status: "pending" | "processing" | "done" | "error";
  result?: {
    id: string | null;
    score_total: number;
    original_text: string;
  };
  error?: string;
}

export default function BatchPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [sharedTopic, setSharedTopic] = useState("");
  const [processing, setProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: BatchItem[] = acceptedFiles.map((file) => ({
      file,
      studentName: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      topic: "",
      status: "pending" as const,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
  });

  function updateItem(index: number, updates: Partial<BatchItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function processAll() {
    if (items.length === 0) return;
    setProcessing(true);
    setCompletedCount(0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === "done") {
        setCompletedCount((c) => c + 1);
        continue;
      }

      const topic = item.topic || sharedTopic;
      if (!topic.trim() || !item.studentName.trim()) {
        updateItem(i, { status: "error", error: "生徒名とTOPICは必須です" });
        setCompletedCount((c) => c + 1);
        continue;
      }

      updateItem(i, { status: "processing" });

      try {
        const formData = new FormData();
        formData.append("image", item.file);
        formData.append("studentName", item.studentName);
        formData.append("topic", topic);
        formData.append("date", new Date().toISOString().slice(0, 10));

        const res = await fetch("/api/correct", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "添削に失敗しました");
        }

        const data = await res.json();
        updateItem(i, {
          status: "done",
          result: {
            id: data.id,
            score_total: data.score_total,
            original_text: data.original_text,
          },
        });
      } catch (err) {
        updateItem(i, {
          status: "error",
          error: err instanceof Error ? err.message : "エラーが発生しました",
        });
      }

      setCompletedCount((c) => c + 1);
    }

    setProcessing(false);
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">一括処理</h1>
          <p className="text-gray-500 text-sm mt-1">
            複数の答案を一度にアップロードして添削
          </p>
        </div>

        {/* Shared topic */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            共通TOPIC（個別に設定しない場合に使用）
          </label>
          <textarea
            value={sharedTopic}
            onChange={(e) => setSharedTopic(e.target.value)}
            placeholder="Agree or disagree: Technology has made our lives more convenient."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-white"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-3xl mb-2">📦</div>
          <p className="text-gray-600 font-medium">
            複数の答案写真をドラッグ＆ドロップ
          </p>
          <p className="text-sm text-gray-400">
            またはクリックしてファイルを選択（複数選択可）
          </p>
        </div>

        {/* Item list */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {items.length}件 — 完了: {doneCount} / エラー: {errorCount} / 待機: {pendingCount}
              </p>
              {processing && (
                <p className="text-sm text-blue-600">
                  処理中... {completedCount}/{items.length}
                </p>
              )}
            </div>

            {items.map((item, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl shadow p-4 border-l-4 ${
                  item.status === "done"
                    ? "border-green-500"
                    : item.status === "error"
                      ? "border-red-500"
                      : item.status === "processing"
                        ? "border-blue-500"
                        : "border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.file.name}</span>
                      {item.status === "processing" && (
                        <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      )}
                      {item.status === "done" && (
                        <span className="text-green-600 text-xs font-bold">
                          {item.result?.score_total}/16
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.studentName}
                        onChange={(e) => updateItem(i, { studentName: e.target.value })}
                        placeholder="生徒名"
                        disabled={item.status !== "pending"}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        value={item.topic}
                        onChange={(e) => updateItem(i, { topic: e.target.value })}
                        placeholder="個別TOPIC（空欄なら共通）"
                        disabled={item.status !== "pending"}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                      />
                    </div>
                    {item.error && (
                      <p className="text-xs text-red-600">{item.error}</p>
                    )}
                    {item.status === "done" && item.result?.id && (
                      <Link
                        href={`/result/${item.result.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        結果を見る →
                      </Link>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <button
                      onClick={() => removeItem(i)}
                      className="text-gray-400 hover:text-red-500 text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={processAll}
              disabled={processing || pendingCount === 0}
              className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  一括添削中... ({completedCount}/{items.length})
                </span>
              ) : (
                `${pendingCount}件を一括添削`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
