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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-500 text-sm mt-1">採点基準とプロンプトの調整</p>
        </div>

        {/* Strictness */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">採点の厳しさ</h2>
          <div className="space-y-3">
            {STRICTNESS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.strictness === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="strictness"
                  value={opt.value}
                  checked={settings.strictness === opt.value}
                  onChange={() => setSettings({ ...settings, strictness: opt.value })}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom instructions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-2">カスタム指示</h2>
          <p className="text-sm text-gray-500 mb-4">
            添削時にAIに追加で伝えたい指示があれば入力してください（任意）
          </p>
          <textarea
            value={settings.customInstructions}
            onChange={(e) =>
              setSettings({ ...settings, customInstructions: e.target.value })
            }
            placeholder="例: 語彙は特に厳しく評価してください。受動態の使い方に注目してフィードバックをお願いします。"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Prompt preview */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-2">プロンプトプレビュー</h2>
          <p className="text-sm text-gray-500 mb-3">
            現在の設定で生成されるシステムプロンプトの追加部分
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap">
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
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {saved ? "✓ 保存しました" : "設定を保存"}
        </button>
      </div>
    </div>
  );
}
