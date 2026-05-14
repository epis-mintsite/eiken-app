import { CorrectionError } from "@/types/correction";

interface Props {
  errors: CorrectionError[];
}

const TYPE_BADGE: Record<string, string> = {
  grammar: "bg-red-100 text-red-700",
  vocabulary: "bg-purple-100 text-purple-700",
  spelling: "bg-orange-100 text-orange-700",
  punctuation: "bg-yellow-100 text-yellow-700",
  style: "bg-blue-100 text-blue-700",
};

export default function ErrorTable({ errors }: Props) {
  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-2">エラーリスト</h2>
        <p className="text-green-600">エラーは見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-4">
        エラーリスト（{errors.length}件）
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">#</th>
              <th className="pb-2 pr-4">タイプ</th>
              <th className="pb-2 pr-4">原文</th>
              <th className="pb-2">修正案</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => (
              <tr key={err.id} className="border-b last:border-0">
                <td className="py-2 pr-4 text-gray-400">{err.id}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      TYPE_BADGE[err.type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {err.type}
                  </span>
                </td>
                <td className="py-2 pr-4 text-red-600 line-through">
                  {err.original}
                </td>
                <td className="py-2 text-green-700 font-medium">
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
