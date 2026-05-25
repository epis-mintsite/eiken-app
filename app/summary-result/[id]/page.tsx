"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ScoreCard from "@/components/ScoreCard";
import GoodPoints from "@/components/GoodPoints";
import ErrorTable from "@/components/ErrorTable";
import ContentAnalysis from "@/components/ContentAnalysis";
import VocabSuggestions from "@/components/VocabSuggestions";
import FeedbackCard from "@/components/FeedbackCard";
import ModelEssayAnnotated from "@/components/ModelEssayAnnotated";
import AdviceList from "@/components/AdviceList";
import {
  SummaryScores,
  SummaryError,
  SummaryFeedback,
  SummaryAdvice,
  ContentAnalysis as ContentAnalysisType,
  VocabSuggestion,
  ModelEssayAnnotation,
} from "@/types/summary";

interface SummaryResultData {
  id: string | null;
  type: "summary";
  student_name: string;
  passage_text: string;
  original_text: string;
  scores: SummaryScores;
  score_total: number;
  good_points: string[];
  errors: SummaryError[];
  content_analysis: ContentAnalysisType;
  vocabulary_suggestions: VocabSuggestion[];
  feedback: SummaryFeedback;
  model_essay: string;
  model_essay_annotations: ModelEssayAnnotation[];
  advice: SummaryAdvice[];
  word_count: number;
}

export default function SummaryResultPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<SummaryResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassage, setShowPassage] = useState(false);

  useEffect(() => {
    async function load() {
      const id = params.id as string;

      if (id === "local") {
        const stored = sessionStorage.getItem("summaryResult");
        if (stored) {
          setData(JSON.parse(stored));
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`/api/correct/${id}`);
        if (!res.ok) throw new Error("結果を取得できませんでした");
        const record = await res.json();
        // Map DB record to SummaryResultData
        setData({
          id: record.id,
          type: "summary",
          student_name: record.student_name,
          passage_text: record.passage_text || "",
          original_text: record.original_text,
          scores: {
            content: record.score_content,
            organization: record.score_org,
            vocabulary: record.score_vocab,
            grammar: record.score_grammar,
          },
          score_total: record.score_content + record.score_org + record.score_vocab + record.score_grammar,
          good_points: record.good_points_json || [],
          errors: record.errors_json || [],
          content_analysis: record.content_analysis_json || {
            key_points_coverage: "",
            unnecessary_content: "",
            structure_issues: "",
          },
          vocabulary_suggestions: record.vocab_suggestions_json || [],
          feedback: record.feedback_json || { content: "", organization: "", vocabulary: "", grammar: "" },
          model_essay: record.model_essay || "",
          model_essay_annotations: [],
          advice: record.advice_json || [],
          word_count: record.word_count,
        });
      } catch (err) {
        const stored = sessionStorage.getItem("summaryResult");
        if (stored) {
          setData(JSON.parse(stored));
        } else {
          setError(
            err instanceof Error ? err.message : "エラーが発生しました"
          );
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
          <p className="text-sm text-[#EB5757]">
            {error || "結果が見つかりません"}
          </p>
          <button
            onClick={() => router.push("/correct")}
            className="text-sm text-[#2383E2] underline"
          >
            添削画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#37352F]">
              要約添削結果
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {data.student_name}
              {data.word_count > 0 && (
                <span className="ml-2">— {data.word_count}語</span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push("/correct")}
            className="border border-[#C3C2BF] text-[#37352F] rounded-lg text-sm font-medium px-4 py-2 hover:bg-[#F7F6F3] transition-colors"
          >
            新しい添削
          </button>
        </div>

        {/* Student's answer */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#37352F]">生徒の解答</h2>
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                data.word_count >= 60 && data.word_count <= 70
                  ? "bg-[#E8F5E9] text-[#4CAF50]"
                  : "bg-[#FFF3E8] text-[#EB5757]"
              }`}
            >
              {data.word_count}語
              {data.word_count < 60 && "（不足）"}
              {data.word_count > 70 && "（超過）"}
            </span>
          </div>
          <div className="bg-[#FBFBFA] rounded-lg p-4">
            <p className="text-sm text-[#37352F] leading-relaxed whitespace-pre-wrap">
              {data.original_text}
            </p>
          </div>
        </div>

        {/* Passage (collapsible) */}
        {data.passage_text && (
          <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
            <button
              onClick={() => setShowPassage(!showPassage)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="text-lg font-semibold text-[#37352F]">課題文</h2>
              <span className="text-xs text-[#2383E2]">
                {showPassage ? "閉じる" : "表示する"}
              </span>
            </button>
            {showPassage && (
              <div className="mt-3 bg-[#F7F6F3] rounded-lg p-4">
                <p className="text-sm text-[#37352F] leading-relaxed whitespace-pre-wrap">
                  {data.passage_text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score */}
        <ScoreCard scores={data.scores} wordCount={data.word_count} />

        {/* Good points */}
        <GoodPoints points={data.good_points} />

        {/* Error table */}
        <ErrorTable errors={data.errors} showExplanation />

        {/* Content analysis */}
        <ContentAnalysis analysis={data.content_analysis} />

        {/* Vocabulary suggestions */}
        <VocabSuggestions suggestions={data.vocabulary_suggestions} />

        {/* Feedback */}
        <FeedbackCard feedback={data.feedback} />

        {/* Model essay with annotations */}
        <ModelEssayAnnotated
          essay={data.model_essay}
          annotations={data.model_essay_annotations || []}
        />

        {/* Advice */}
        <AdviceList advice={data.advice} />
      </div>
    </div>
  );
}
