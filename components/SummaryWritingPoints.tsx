import { SummaryWritingPoint } from "@/types/summary";

interface Props {
  points: SummaryWritingPoint[];
}

export default function SummaryWritingPoints({ points }: Props) {
  if (!points || points.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">
        要約文の作成ポイント
      </h2>
      <div className="space-y-3">
        {points.map((p, i) => (
          <div
            key={i}
            className="bg-[#FBFBFA] border border-[#EEEEEC] rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#2383E2] text-white flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#37352F]">
                  {p.title}
                </p>
                <p className="mt-1.5 text-sm text-[#6B6B6B] leading-relaxed">
                  {p.explanation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
