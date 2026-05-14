import { CorrectionError } from "@/types/correction";

interface Props {
  errors: CorrectionError[];
}

const TYPE_BADGE: Record<string, string> = {
  grammar: "bg-[#FFE8EF] text-[#E255A1]",
  vocabulary: "bg-[#F3E8FF] text-[#6C5CE7]",
  spelling: "bg-[#FFF3E8] text-[#FF8C42]",
  punctuation: "bg-[#FFF9E0] text-[#8D6E63]",
  style: "bg-[#E8F4FD] text-[#2383E2]",
};

export default function ErrorTable({ errors }: Props) {
  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
        <h2 className="text-lg font-semibold text-[#37352F] mb-2">エラーリスト</h2>
        <p className="text-sm text-[#4CAF50]">エラーは見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-4">
        エラーリスト（{errors.length}件）
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
              <th className="py-2 px-3 rounded-tl-lg">#</th>
              <th className="py-2 px-3">タイプ</th>
              <th className="py-2 px-3">原文</th>
              <th className="py-2 px-3 rounded-tr-lg">修正案</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => (
              <tr key={err.id} className="border-b border-[#EEEEEC] last:border-0">
                <td className="py-2 px-3 text-[#9B9A97]">{err.id}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      TYPE_BADGE[err.type] || "bg-[#F7F6F3] text-[#6B6B6B]"
                    }`}
                  >
                    {err.type}
                  </span>
                </td>
                <td className="py-2 px-3 text-[#EB5757] line-through">
                  {err.original}
                </td>
                <td className="py-2 px-3 text-[#4CAF50] font-medium">
                  {err.correction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
