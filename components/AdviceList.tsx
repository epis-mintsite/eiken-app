import { Advice } from "@/types/correction";

interface Props {
  advice: Advice[];
}

const PRIORITY_STYLE: Record<string, { border: string; badge: string; label: string }> = {
  high: { border: "border-[#E255A1]/30", badge: "bg-[#FFE8EF] text-[#E255A1]", label: "高" },
  medium: { border: "border-[#8D6E63]/30", badge: "bg-[#FFF9E0] text-[#8D6E63]", label: "中" },
  low: { border: "border-[#4CAF50]/30", badge: "bg-[#E8F5E9] text-[#4CAF50]", label: "低" },
};

export default function AdviceList({ advice }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">学習アドバイス</h2>
      <div className="space-y-3">
        {advice.map((item, i) => {
          const style = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium;
          return (
            <div key={i} className={`border rounded-lg p-4 ${style.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${style.badge}`}>
                  優先度: {style.label}
                </span>
                <h3 className="font-semibold text-[#37352F]">{item.title}</h3>
              </div>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
