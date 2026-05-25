"use client";

interface Props {
  analysis: {
    key_points_coverage: string;
    unnecessary_content: string;
    structure_issues: string;
  };
}

const SECTIONS = [
  {
    key: "key_points_coverage" as const,
    label: "要点のカバー",
    color: "#6C5CE7",
    icon: "📋",
  },
  {
    key: "unnecessary_content" as const,
    label: "不要な内容",
    color: "#FF8C42",
    icon: "✂️",
  },
  {
    key: "structure_issues" as const,
    label: "構成の問題点",
    color: "#2383E2",
    icon: "🔗",
  },
];

export default function ContentAnalysis({ analysis }: Props) {
  if (!analysis) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">
        内容・構成の分析
      </h2>
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div
            key={s.key}
            className="bg-[#F7F6F3] rounded-lg p-4"
            style={{ borderLeft: `4px solid ${s.color}` }}
          >
            <p className="text-sm font-semibold text-[#37352F] flex items-center gap-2">
              <span>{s.icon}</span>
              {s.label}
            </p>
            <p className="text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">
              {analysis[s.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
