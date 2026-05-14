import { Advice } from "@/types/correction";

interface Props {
  advice: Advice[];
}

const PRIORITY_STYLE: Record<string, { bg: string; badge: string; label: string }> = {
  high: { bg: "border-red-200", badge: "bg-red-100 text-red-700", label: "高" },
  medium: { bg: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", label: "中" },
  low: { bg: "border-green-200", badge: "bg-green-100 text-green-700", label: "低" },
};

export default function AdviceList({ advice }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-4">学習アドバイス</h2>
      <div className="space-y-3">
        {advice.map((item, i) => {
          const style = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium;
          return (
            <div key={i} className={`border rounded-lg p-4 ${style.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                  優先度: {style.label}
                </span>
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
