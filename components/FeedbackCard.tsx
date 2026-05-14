import { Feedback } from "@/types/correction";

interface Props {
  feedback: Feedback;
}

const SECTIONS: { key: keyof Feedback; label: string; icon: string; borderColor: string }[] = [
  { key: "content", label: "内容", icon: "📝", borderColor: "border-l-[#6C5CE7]" },
  { key: "organization", label: "構成", icon: "🏗️", borderColor: "border-l-[#4DB6AC]" },
  { key: "vocabulary", label: "語彙", icon: "📚", borderColor: "border-l-[#FF8C42]" },
  { key: "grammar", label: "文法", icon: "✏️", borderColor: "border-l-[#E255A1]" },
];

export default function FeedbackCard({ feedback }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">4観点別 講評</h2>
      <div className="space-y-4">
        {SECTIONS.map(({ key, label, icon, borderColor }) => (
          <div key={key} className={`bg-[#F7F6F3] rounded-lg p-4 border-l-4 ${borderColor}`}>
            <h3 className="font-semibold text-[#37352F] mb-1">
              {icon} {label}
            </h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">
              {feedback[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
