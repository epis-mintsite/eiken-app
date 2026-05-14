import { CorrectionError } from "@/types/correction";

interface Props {
  originalText: string;
  errors: CorrectionError[];
}

interface Segment {
  text: string;
  isError: boolean;
  error?: CorrectionError;
}

function buildSegments(text: string, errors: CorrectionError[]): Segment[] {
  if (errors.length === 0) {
    return [{ text, isError: false }];
  }

  // エラー箇所を原文中で検索し、位置でソート
  const matches: { start: number; end: number; error: CorrectionError }[] = [];
  for (const err of errors) {
    const idx = text.indexOf(err.original);
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + err.original.length, error: err });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  // 重複を除去（先に見つかったものを優先）
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  const segments: Segment[] = [];
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) {
      segments.push({ text: text.slice(pos, m.start), isError: false });
    }
    segments.push({ text: text.slice(m.start, m.end), isError: true, error: m.error });
    pos = m.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), isError: false });
  }

  return segments;
}

export default function DiffHighlight({ originalText, errors }: Props) {
  const segments = buildSegments(originalText, errors);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold mb-3">原文（エラー箇所ハイライト）</h2>
      <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.isError ? (
            <span key={i} className="relative group">
              <span className="bg-red-100 text-red-700 underline decoration-red-400 decoration-wavy cursor-help">
                {seg.text}
              </span>
              {seg.error && (
                <span className="invisible group-hover:visible absolute bottom-full left-0 mb-1 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                  <span className="block text-gray-400">{seg.error.type}</span>
                  <span className="block">
                    → <span className="text-green-300 font-medium">{seg.error.correction}</span>
                  </span>
                </span>
              )}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>
      {errors.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          エラー箇所にマウスを重ねると修正案が表示されます
        </p>
      )}
    </div>
  );
}
