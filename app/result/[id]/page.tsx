"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ScoreCard from "@/components/ScoreCard";
import ErrorTable from "@/components/ErrorTable";
import FeedbackCard from "@/components/FeedbackCard";
import ModelEssay from "@/components/ModelEssay";
import AdviceList from "@/components/AdviceList";
import ExportButtons from "@/components/ExportButtons";
import DiffHighlight from "@/components/DiffHighlight";
import { Scores, CorrectionError, Feedback, Advice } from "@/types/correction";

interface ResultData {
  id: string | null;
  student_name: string;
  topic: string;
  original_text: string;
  scores: Scores;
  score_total: number;
  errors: CorrectionError[];
  feedback: Feedback;
  model_essay: string;
  advice: Advice[];
  word_count: number;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const id = params.id as string;

      if (id === "local") {
        const stored = sessionStorage.getItem("correctionResult");
        if (stored) {
          setData(JSON.parse(stored));
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`/api/correct/${id}`);
        if (!res.ok) throw new Error("結果を取得できませんでした");
        setData(await res.json());
      } catch (err) {
        const stored = sessionStorage.getItem("correctionResult");
        if (stored) {
          setData(JSON.parse(stored));
        } else {
          setError(err instanceof Error ? err.message : "エラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-[#6C5CE7] border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-[#9B9A97]">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[#EB5757]">{error || "結果が見つかりません"}</p>
          <button
            onClick={() => router.push("/upload")}
            className="text-sm text-[#2383E2] underline"
          >
            アップロード画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#37352F]">添削結果</h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {data.student_name} — {data.topic}
            </p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="border border-[#C3C2BF] text-[#37352F] rounded-lg text-sm font-medium px-4 py-2 hover:bg-[#F7F6F3] transition-colors"
          >
            新しい添削
          </button>
        </div>

        <DiffHighlight originalText={data.original_text} errors={data.errors} />

        <ScoreCard scores={data.scores} wordCount={data.word_count} />
        <ErrorTable errors={data.errors} />
        <FeedbackCard feedback={data.feedback} />
        <ModelEssay essay={data.model_essay} />
        <AdviceList advice={data.advice} />
        <ExportButtons data={data} />
      </div>
    </div>
  );
}
