"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import GrandprixReport from "@/components/grandprix/GrandprixReport";
import type { GPDraft, GPRecord } from "@/types/grandprix";
import { GP_RESTORE_KEY } from "@/lib/grandprix/rubric";

export default function GrandprixResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [record, setRecord] = useState<GPRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      // 保存に失敗した場合のみ、直前の結果を端末内から表示する
      if (id === "local") {
        const stored = sessionStorage.getItem("gpResult");
        if (stored) setRecord(JSON.parse(stored));
        else setError("結果が見つかりません");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/grandprix/${id}`);
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

  function retry() {
    if (!record) return;
    const draft: GPDraft = {
      division: record.division,
      knock: record.knock,
      country: record.country,
      title: record.title,
      summary: record.summary,
      body: record.body,
      grade: record.grade,
      feedbackLang: record.feedbackLang,
    };
    try {
      sessionStorage.setItem(GP_RESTORE_KEY, JSON.stringify(draft));
    } catch {}
    router.push("/grandprix");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#9B9A97]">読み込み中...</div>;
  }

  if (error || !record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#B3261E]">{error || "結果が見つかりません"}</p>
        <Link href="/history?tab=grandprix" className="text-sm text-[#2383E2] hover:underline">
          履歴へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden">
          <Link href="/history?tab=grandprix" className="text-sm text-[#2383E2] hover:underline">
            ← 履歴
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-[#BFD3E6] px-3 py-1.5 text-sm font-medium text-[#1F4E79]"
            >
              印刷／PDF保存
            </button>
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-[#1F4E79] px-3 py-1.5 text-sm font-semibold text-white"
            >
              直してもう一度チェック
            </button>
          </div>
        </div>
        {id === "local" && (
          <p className="mb-6 rounded-lg bg-[#FFF8DC] border border-[#F0E0A0] p-3 text-sm print:hidden">
            結果の保存に失敗したため、この画面を閉じると見られなくなります。必要なら印刷して残してください。
          </p>
        )}
        <GrandprixReport record={record} />
      </div>
    </div>
  );
}
