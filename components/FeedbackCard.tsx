import { Feedback } from "@/types/correction";

interface Props {
  feedback: Feedback;
}

const SECTIONS: { key: keyof Feedback; label: string; icon: string }[] = [
  { key: "content", label: "内容", icon: "📝" },
  { key: "organization", label: "構成", icon: "🏗️" },
  { key: "vocabulary", label: "語彙", icon: "📚" },
  { key: "grammar", label: "文法", icon: "✏️" },
];

export default function FeedbackCard({ feedback }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-4">4観点別 講評</h2>
      <div className="space-y-4">
        {SECTIONS.map(({ key, label, icon }) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-1">
              {icon} {label}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
