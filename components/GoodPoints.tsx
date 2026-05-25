"use client";

interface Props {
  points: string[];
}

export default function GoodPoints({ points }: Props) {
  if (!points || points.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">良かった点</h2>
      <ul className="space-y-3">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E8F5E9] text-[#4CAF50] flex items-center justify-center text-xs font-bold mt-0.5">
              ✓
            </span>
            <span className="text-sm text-[#37352F] leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
