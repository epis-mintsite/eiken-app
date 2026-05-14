interface Props {
  essay: string;
}

export default function ModelEssay({ essay }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-3">模範答案</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {essay}
        </p>
      </div>
    </div>
  );
}
