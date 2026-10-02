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

  function statusIndicator(status: BatchItem["status"]) {
    switch (status) {
      case "pending":
        return <span className="text-[#9B9A97] text-xs">待機中</span>;
      case "processing":
        return (
          <span className="flex items-center gap-1.5 text-[#6C5CE7] text-xs font-medium">
            <span className="animate-spin h-3.5 w-3.5 border-2 border-[#6C5CE7] border-t-transparent rounded-full" />
            処理中
          </span>
        );
      case "done":
        return <span className="text-[#4CAF50] text-xs font-medium">✓ 完了</span>;
      case "error":
        return <span className="text-[#EB5757] text-xs font-medium">エラー</span>;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">一括添削処理</h1>
          <p className="text-sm text-[#9B9A97] mt-1">
            複数の答案を一度にアップロードして添削
          </p>
        </div>

        {/* Shared topic */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <label className="block text-sm font-medium text-[#37352F] mb-2">
            共通TOPIC（個別に設定しない場合に使用）
          </label>
          <textarea
            value={sharedTopic}
            onChange={(e) => setSharedTopic(e.target.value)}
            placeholder="Agree or disagree: Technology has made our lives more convenient."
            rows={2}
            className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none resize-none"
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-[#6C5CE7] bg-[#6C5CE7]/5"
              : "border-[#E3E2DE] bg-[#FBFBFA] hover:border-[#C3C2BF]"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-3xl mb-2">📦</div>
          <p className="text-sm font-medium text-[#37352F]">
            複数の答案写真をドラッグ＆ドロップ
          </p>
          <p className="text-sm text-[#9B9A97] mt-1">
            またはクリックしてファイルを選択（複数選択可）
          </p>
        </div>

        {/* Item list */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6B6B6B]">
                {items.length}件 — 完了: {doneCount} / エラー: {errorCount} / 待機: {pendingCount}
              </p>
              {processing && (
                <p className="text-sm text-[#6C5CE7] font-medium">
                  処理中... {completedCount}/{items.length}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E3E2DE] divide-y divide-[#EEEEEC]">
              {items.map((item, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#9B9A97]">{item.file.name}</span>
                        {statusIndicator(item.status)}
                        {item.status === "done" && item.result && (
                          <span className="text-[#4CAF50] text-xs font-bold">
                            {item.result.score_total}/16
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
                          className="flex-1 border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none disabled:bg-[#F7F6F3] disabled:text-[#9B9A97]"
                        />
                        <input
                          type="text"
                          value={item.topic}
                          onChange={(e) => updateItem(i, { topic: e.target.value })}
                          placeholder="個別TOPIC（空欄なら共通）"
                          disabled={item.status !== "pending"}
                          className="flex-1 border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none disabled:bg-[#F7F6F3] disabled:text-[#9B9A97]"
                        />
                      </div>
                      {item.error && (
                        <p className="text-xs text-[#EB5757]">{item.error}</p>
                      )}
                      {item.status === "done" && item.result?.id && (
                        <Link
                          href={`/result/${item.result.id}`}
                          className="text-xs text-[#2383E2] hover:underline"
                        >
                          結果を見る →
                        </Link>
                      )}
                    </div>
                    {item.status === "pending" && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-[#EB5757] hover:opacity-70 text-lg font-medium transition-opacity"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={processAll}
              disabled={processing || pendingCount === 0}
              className="w-full py-3 rounded-lg font-medium text-white bg-[#6C5CE7] hover:opacity-90 disabled:bg-[#E3E2DE] disabled:text-[#9B9A97] disabled:cursor-not-allowed transition-opacity"
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
