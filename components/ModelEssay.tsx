interface Props {
  essay: string;
}

export default function ModelEssay({ essay }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <h2 className="text-lg font-semibold text-[#37352F] mb-3">模範答案</h2>
      <div className="bg-[#F3E8FF] border border-[#6C5CE7]/20 rounded-lg p-5">
        <p className="text-sm text-[#37352F] leading-relaxed whitespace-pre-wrap">
          {essay}
        </p>
      </div>
    </div>
  );
}
