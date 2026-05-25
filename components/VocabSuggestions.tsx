"use client";

interface VocabSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

interface Props {
  suggestions: VocabSuggestion[];
}

export default function VocabSuggestions({ suggestions }: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">
        語彙の言い換え提案
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E3E2DE]">
              <th className="text-left py-2.5 px-3 text-[#6B6B6B] font-medium">
                元の表現
              </th>
              <th className="text-center py-2.5 px-2 text-[#6B6B6B] font-medium w-8">
              </th>
              <th className="text-left py-2.5 px-3 text-[#6B6B6B] font-medium">
                推奨表現
              </th>
              <th className="text-left py-2.5 px-3 text-[#6B6B6B] font-medium">
                理由
              </th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, i) => (
              <tr
                key={i}
                className={
                  i < suggestions.length - 1
                    ? "border-b border-[#EEEEEC]"
                    : ""
                }
              >
                <td className="py-2.5 px-3 text-[#EB5757] font-mono">
                  {s.original}
                </td>
                <td className="py-2.5 px-2 text-center text-[#9B9A97]">→</td>
                <td className="py-2.5 px-3 text-[#4CAF50] font-mono font-medium">
                  {s.suggested}
                </td>
                <td className="py-2.5 px-3 text-[#6B6B6B]">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
