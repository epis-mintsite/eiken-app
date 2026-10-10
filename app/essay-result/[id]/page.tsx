"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import EssayReport from "@/components/essay/EssayReport";
import type { EssayRecord } from "@/types/essay";

export default function EssayResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<EssayRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      // 保存に失敗した場合のみ、直前の結果を端末内から表示する
      if (id === "local") {
        const stored = sessionStorage.getItem("essayResult");
        if (stored) setRecord(JSON.parse(stored));
        else setError("結果が見つかりません");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/essay/${id}`);
        if (!res.ok) throw new Error("結果を取得できませんでした");
        setRecord(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#9B9A97]">読み込み中...</div>;
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#B3261E]">{error || "結果が見つかりません"}</p>
        <Link href="/history" className="text-sm text-[#2383E2] hover:underline">
          履歴へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/history?tab=essay" className="text-sm text-[#2383E2] hover:underline">
            ← 履歴
          </Link>
          <Link href="/essay" className="text-sm text-[#2383E2] hover:underline">
            新しく添削する
          </Link>
        </div>
        {id === "local" && (
          <p className="mb-6 rounded-lg bg-[#FFF8DC] border border-[#F0E0A0] p-3 text-sm print:hidden">
            結果の保存に失敗したため、この画面を閉じると見られなくなります。必要なら印刷して残してください。
          </p>
        )}
        <EssayReport record={record} />
      </div>
    </div>
  );
}
