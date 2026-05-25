"use client";

import { useState } from "react";

interface Annotation {
  sentence: string;
  role: string;
  explanation: string;
  techniques: string[];
}

interface Props {
  essay: string;
  annotations: Annotation[];
}

const TECHNIQUE_COLORS: Record<string, string> = {
  "パラフレーズ": "#6C5CE7",
  "名詞化": "#2383E2",
  "文の結合": "#4DB6AC",
  "抽象化": "#FF8C42",
  "具体化": "#E255A1",
  "語彙の言い換え": "#6C5CE7",
  "名詞化による圧縮": "#2383E2",
};

function getTechColor(tech: string): string {
  return TECHNIQUE_COLORS[tech] || "#9B9A97";
}

export default function ModelEssayAnnotated({ essay, annotations }: Props) {
  const [showAnnotations, setShowAnnotations] = useState(true);

  const wordCount = essay
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#37352F]">模範解答</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9B9A97]">{wordCount}語</span>
          {annotations && annotations.length > 0 && (
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="text-xs text-[#2383E2] hover:underline"
            >
              {showAnnotations ? "解説を閉じる" : "解説を見る"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#F3E8FF] border border-[rgba(108,92,231,0.2)] rounded-lg p-5">
        <p className="text-sm text-[#37352F] leading-relaxed whitespace-pre-wrap">
          {essay}
        </p>
      </div>

      {showAnnotations && annotations && annotations.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#6B6B6B]">
            構成解説（各文の役割と修正ポイント）
          </h3>
          {annotations.map((a, i) => (
            <div
              key={i}
              className="bg-[#FBFBFA] border border-[#EEEEEC] rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#6C5CE7] text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#37352F] font-mono leading-relaxed">
                    {a.sentence}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#6C5CE7]">
                    {a.role}
                  </p>
                  <p className="mt-1.5 text-sm text-[#6B6B6B] leading-relaxed">
                    {a.explanation}
                  </p>
                  {a.techniques && a.techniques.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.techniques.map((tech, j) => (
                        <span
                          key={j}
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getTechColor(tech) }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
