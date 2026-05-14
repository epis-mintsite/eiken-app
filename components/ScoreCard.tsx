import { Scores } from "@/types/correction";

interface Props {
  scores: Scores;
  wordCount: number;
}

const LABELS: { key: keyof Scores; label: string }[] = [
  { key: "content", label: "内容" },
  { key: "organization", label: "構成" },
  { key: "vocabulary", label: "語彙" },
  { key: "grammar", label: "文法" },
];

function scoreColor(score: number): string {
  if (score >= 4) return "text-[#4CAF50]";
  if (score >= 3) return "text-[#6C5CE7]";
  if (score >= 2) return "text-[#FF9800]";
  return "text-[#EB5757]";
}

function barWidth(score: number): string {
  return `${(score / 4) * 100}%`;
}

function barColor(score: number): string {
  if (score >= 4) return "bg-[#4CAF50]";
  if (score >= 3) return "bg-[#6C5CE7]";
  if (score >= 2) return "bg-[#FF9800]";
  return "bg-[#EB5757]";
}

export default function ScoreCard({ scores, wordCount }: Props) {
  const total = scores.content + scores.organization + scores.vocabulary + scores.grammar;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-[#37352F]">採点結果</h2>
        <div className="text-right">
          <span className={`text-3xl font-semibold ${scoreColor(total / 4)}`}>
            {total}
          </span>
          <span className="text-[#9B9A97] text-lg"> / 16</span>
        </div>
      </div>
      <p className="text-sm text-[#9B9A97]">語数: {wordCount}</p>
      <div className="space-y-3">
        {LABELS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#37352F]">{label}</span>
              <span className={`font-semibold ${scoreColor(scores[key])}`}>
                {scores[key]} / 4
              </span>
            </div>
            <div className="w-full bg-[#EEEEEC] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor(scores[key])}`}
                style={{ width: barWidth(scores[key]) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
