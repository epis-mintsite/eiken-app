"use client";

import { useState, useEffect } from "react";

interface Settings {
  strictness: "lenient" | "standard" | "strict";
  customInstructions: string;
}

const DEFAULT_SETTINGS: Settings = {
  strictness: "standard",
  customInstructions: "",
};

const STRICTNESS_OPTIONS = [
  {
    value: "lenient" as const,
    label: "やさしめ",
    desc: "初学者向け。良い点を積極的に評価し、基本的なミスのみ指摘します。",
  },
  {
    value: "standard" as const,
    label: "標準",
    desc: "英検準一級の公式採点基準に準拠した標準的な採点を行います。",
  },
  {
    value: "strict" as const,
    label: "厳しめ",
    desc: "上位合格を目指す生徒向け。細かいニュアンスや語彙レベルも厳密に評価します。",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eikenSettings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        // skip
      }
    }
  }, []);

  function save() {
    localStorage.setItem("eikenSettings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-8 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">設定</h1>
          <p className="text-sm text-[#9B9A97] mt-1">採点基準とプロンプトの調整</p>
        </div>

        {/* Strictness */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <h2 className="text-lg font-semibold text-[#37352F] mb-4">採点の厳しさ</h2>
          <div className="space-y-3">
            {STRICTNESS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  settings.strictness === opt.value
                    ? "border-[#6C5CE7] bg-[#6C5CE7]/5"
                    : "border-[#E3E2DE] hover:border-[#C3C2BF]"
                }`}
              >
                <input
                  type="radio"
                  name="strictness"
                  value={opt.value}
                  checked={settings.strictness === opt.value}
                  onChange={() => setSettings({ ...settings, strictness: opt.value })}
                  className="mt-1 accent-[#6C5CE7]"
                />
                <div>
                  <p className="font-medium text-[#37352F]">{opt.label}</p>
                  <p className="text-sm text-[#6B6B6B]">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom instructions */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <h2 className="text-lg font-semibold text-[#37352F] mb-2">カスタム指示</h2>
          <p className="text-sm text-[#6B6B6B] mb-4">
            添削時にAIに追加で伝えたい指示があれば入力してください（任意）
          </p>
          <textarea
            value={settings.customInstructions}
            onChange={(e) =>
              setSettings({ ...settings, customInstructions: e.target.value })
            }
            placeholder="例: 語彙は特に厳しく評価してください。受動態の使い方に注目してフィードバックをお願いします。"
            rows={4}
            className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none resize-none"
          />
        </div>

        {/* Prompt preview */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <h2 className="text-lg font-semibold text-[#37352F] mb-2">プロンプトプレビュー</h2>
          <p className="text-sm text-[#6B6B6B] mb-3">
            現在の設定で生成されるシステムプロンプトの追加部分
          </p>
          <div className="bg-[#F7F6F3] rounded-lg p-4 text-xs font-mono text-[#6B6B6B] whitespace-pre-wrap">
            {settings.strictness === "lenient"
              ? "【採点方針】やさしめ — 良い点を積極的に評価し、基本的なミスのみ指摘。スコアは甘めに付けてください。"
              : settings.strictness === "strict"
                ? "【採点方針】厳しめ — 準一級上位合格を意識し、語彙・文法・構成の細部まで厳密に評価。スコアは厳しめに付けてください。"
                : "【採点方針】標準 — 英検準一級の公式採点基準に準拠して公平に採点してください。"}
            {settings.customInstructions &&
              `\n\n【追加指示】\n${settings.customInstructions}`}
          </div>
        </div>

        <button
          onClick={save}
          className="w-full py-3 rounded-lg font-medium text-white bg-[#6C5CE7] hover:opacity-90 transition-opacity"
        >
          {saved ? (
            <span className="text-[#4CAF50]">✓ 保存しました</span>
          ) : (
            "設定を保存"
          )}
        </button>
      </div>
    </div>
  );
}
