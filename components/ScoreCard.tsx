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
  if (score >= 4) return "text-green-600";
  if (score >= 3) return "text-blue-600";
  if (score >= 2) return "text-yellow-600";
  return "text-red-600";
}

function barWidth(score: number): string {
  return `${(score / 4) * 100}%`;
}

function barColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-blue-500";
  if (score >= 2) return "bg-yellow-500";
  return "bg-red-500";
}

export default function ScoreCard({ scores, wordCount }: Props) {
  const total = scores.content + scores.organization + scores.vocabulary + scores.grammar;

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">採点結果</h2>
        <div className="text-right">
          <span className={`text-3xl font-bold ${scoreColor(total / 4)}`}>
            {total}
          </span>
          <span className="text-gray-400 text-lg"> / 16</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">語数: {wordCount}</p>
      <div className="space-y-3">
        {LABELS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{label}</span>
              <span className={`font-bold ${scoreColor(scores[key])}`}>
                {scores[key]} / 4
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
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
