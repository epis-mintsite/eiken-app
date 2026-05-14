import Link from "next/link";

const sections = [
  {
    id: "overview",
    title: "アプリ概要",
    color: "#6C5CE7",
    content: `このアプリは、英検準一級ライティング試験の手書き答案を写真で撮影・アップロードし、AIが自動でOCR（文字認識）→ 採点 → 添削 → フィードバックを行うシステムです。

採点は英検の公式ルーブリックに基づき、4つの観点（内容・構成・語彙・文法）をそれぞれ0〜4点、合計16点満点で評価します。`,
  },
  {
    id: "correction",
    title: "1. 添削する（基本操作）",
    color: "#6C5CE7",
    steps: [
      { label: "アップロード画面を開く", detail: "トップページの「新規添削」ボタン、またはナビゲーションの「新規添削」をクリックします。" },
      { label: "答案の写真を選択", detail: "ドラッグ＆ドロップエリアに写真ファイルをドラッグするか、クリックしてファイルを選択します。JPG / PNG / WebP 形式、最大10MBまで対応しています。スマホの場合は「カメラで撮影」ボタンからその場で撮影もできます。" },
      { label: "生徒名を入力", detail: "添削対象の生徒名を入力します（必須）。" },
      { label: "TOPICを入力", detail: "出題されたTOPIC（英語のお題）を入力します（必須）。例: 「Agree or disagree: Technology has made our lives more convenient.」" },
      { label: "日付を確認", detail: "添削日は自動で今日の日付が入ります。変更も可能です。" },
      { label: "「添削を開始」をクリック", detail: "すべての必須項目を入力すると、ボタンが有効になります。クリックすると、AIがOCR → 採点 → 添削を自動で実行します。ストリーミングモードがONの場合、処理経過がリアルタイムで表示されます。" },
      { label: "結果を確認", detail: "処理完了後、自動的に結果画面に遷移します。" },
    ],
  },
  {
    id: "result",
    title: "2. 添削結果の見方",
    color: "#4DB6AC",
    items: [
      { name: "原文（エラー箇所ハイライト）", desc: "OCRで読み取った原文が表示されます。エラー箇所は赤くハイライトされ、マウスを重ねると（PCの場合）修正案がポップアップ表示されます。" },
      { name: "採点結果", desc: "4観点（内容・構成・語彙・文法）のスコアがプログレスバー付きで表示されます。合計スコアも大きく表示されます。" },
      { name: "エラーリスト", desc: "検出されたエラーが一覧表で表示されます。タイプ（grammar / vocabulary / spelling 等）、原文、修正案が確認できます。" },
      { name: "4観点別 講評", desc: "各観点についてのAIによる詳細なフィードバックが表示されます。" },
      { name: "模範答案", desc: "同じTOPICに対するAI生成の模範解答が表示されます。生徒の学習参考に活用できます。" },
      { name: "学習アドバイス", desc: "生徒の弱点に基づいた具体的な学習アドバイスが、優先度（高・中・低）付きで表示されます。" },
    ],
  },
  {
    id: "export",
    title: "3. レポート出力",
    color: "#FF8C42",
    steps: [
      { label: "PDF ダウンロード", detail: "結果画面下部の「PDFダウンロード」ボタンをクリックすると、印刷ダイアログが開きます。「PDFとして保存」を選択してください。" },
      { label: "Word ダウンロード", detail: "「Wordダウンロード」ボタンをクリックすると、.docx ファイルが直接ダウンロードされます。" },
    ],
    extra: `【スマホでのPDF保存方法】
・iPhone（Safari）: 印刷プレビューをピンチアウト（2本指で広げる）→ 共有ボタン → 「ファイルに保存」
・iPhone（Chrome）: 送信先を「PDFとして保存」に変更 → 「保存」
・Android（Chrome）: 「プリンタを選択」→「PDF形式で保存」→ 青い「PDF」ボタン`,
  },
  {
    id: "batch",
    title: "4. 一括処理",
    color: "#E255A1",
    steps: [
      { label: "一括処理画面を開く", detail: "トップページの「一括処理」カード、またはナビゲーションから移動します。" },
      { label: "複数ファイルをアップロード", detail: "ドロップエリアに複数の答案写真をまとめてドラッグ＆ドロップします。" },
      { label: "共通TOPICを入力", detail: "全員共通のTOPICがある場合は、共通TOPIC欄に入力します。個別に変更も可能です。" },
      { label: "各ファイルの生徒名を入力", detail: "ファイルごとに生徒名を入力します。TOPICも個別に変更できます。" },
      { label: "「一括添削を開始」をクリック", detail: "すべてのファイルが順番に処理されます。各ファイルの状態（待機中・処理中・完了・エラー）がリアルタイムで表示されます。" },
      { label: "完了後、各結果を確認", detail: "処理が完了したファイルは「結果を見る」リンクから個別の結果画面に移動できます。" },
    ],
  },
  {
    id: "history",
    title: "5. 添削履歴",
    color: "#2383E2",
    steps: [
      { label: "履歴画面を開く", detail: "ナビゲーションの「履歴」をクリックします。" },
      { label: "検索・フィルタ", detail: "検索ボックスに生徒名またはTOPICを入力すると、該当する添削結果が絞り込まれます。" },
      { label: "結果を確認", detail: "一覧から生徒名をクリックすると、その添削の詳細結果画面に移動します。" },
      { label: "ページ移動", detail: "15件ごとにページ分けされます。「前へ」「次へ」ボタンでページを移動します。" },
    ],
  },
  {
    id: "students",
    title: "6. 生徒管理",
    color: "#4CAF50",
    steps: [
      { label: "生徒管理画面を開く", detail: "ナビゲーションの「生徒管理」をクリックします。" },
      { label: "生徒を登録", detail: "「生徒名」と「学年」を入力して「追加」ボタンをクリックします。" },
      { label: "生徒を削除", detail: "登録済み生徒の右側にある「削除」ボタンをクリックします。" },
    ],
  },
  {
    id: "settings",
    title: "7. 設定",
    color: "#8D6E63",
    items: [
      { name: "採点の厳しさ", desc: "「やさしめ」「標準」「厳しめ」の3段階から選択できます。生徒のレベルに合わせて調整してください。" },
      { name: "カスタム指示", desc: "AIへの追加指示を自由に入力できます。例: 「受動態の使い方に注目して添削してください」「初心者向けに優しいフィードバックをお願いします」" },
      { name: "プロンプトプレビュー", desc: "現在の設定でAIに送信されるプロンプトの一部がプレビュー表示されます。" },
    ],
    extra: "設定はブラウザのローカルストレージに保存されるため、同じブラウザで次回以降も設定が引き継がれます。",
  },
  {
    id: "tips",
    title: "8. きれいに添削するコツ",
    color: "#6C5CE7",
    tips: [
      "答案の写真は明るい場所で撮影し、文字がはっきり読めるようにしてください。",
      "写真は答案部分だけをトリミングするとOCR精度が向上します。",
      "TOPICは出題文をできるだけ正確に入力してください。AIの採点精度が向上します。",
      "ストリーミングモードをONにすると、処理の経過がリアルタイムで確認でき、待ち時間が短く感じられます。",
      "一度に大量の添削を行う場合は「一括処理」機能を使うと効率的です。",
    ],
  },
  {
    id: "faq",
    title: "9. よくある質問",
    color: "#9B9A97",
    faqs: [
      { q: "対応している画像形式は？", a: "JPG、PNG、WebP の3形式に対応しています。最大ファイルサイズは10MBです。" },
      { q: "添削にかかる時間は？", a: "通常10〜30秒程度です。画像の解像度やテキスト量によって前後します。" },
      { q: "スマホからも使えますか？", a: "はい。スマホのブラウザからアクセスすれば、PCと同じ機能が使えます。カメラで直接撮影してアップロードすることもできます。" },
      { q: "添削結果は保存されますか？", a: "はい。データベースに自動保存され、「添削履歴」画面からいつでも確認できます。" },
      { q: "採点基準は何ですか？", a: "英検準一級の公式ルーブリックに基づき、内容（Content）・構成（Organization）・語彙（Vocabulary）・文法（Grammar）の4観点を各0〜4点で評価します。" },
      { q: "PDFが保存できません", a: "ポップアップブロックが有効になっている場合、印刷ダイアログが開けないことがあります。ブラウザの設定でこのサイトのポップアップを許可してください。" },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#191919] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            操作ガイド
          </h1>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.7)]">
            英検準一級 ライティング添削アプリの使い方
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Table of contents */}
        <nav className="bg-[#F7F6F3] rounded-xl p-6 mb-10">
          <h2 className="text-sm font-semibold text-[#37352F] mb-3">目次</h2>
          <ul className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-[#2383E2] hover:underline flex items-center gap-2"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2
                className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b-2"
                style={{ color: s.color, borderColor: s.color }}
              >
                {s.title}
              </h2>

              {/* Overview text */}
              {s.content && (
                <div className="text-sm text-[#37352F] leading-relaxed whitespace-pre-line">
                  {s.content}
                </div>
              )}

              {/* Steps */}
              {s.steps && (
                <ol className="space-y-4">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold mt-0.5"
                        style={{ background: s.color }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#37352F]">{step.label}</p>
                        <p className="text-sm text-[#6B6B6B] mt-1 leading-relaxed">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {/* Items (key-value) */}
              {s.items && (
                <div className="space-y-3">
                  {s.items.map((item, i) => (
                    <div
                      key={i}
                      className="bg-[#F7F6F3] rounded-lg p-4"
                      style={{ borderLeft: `4px solid ${s.color}` }}
                    >
                      <p className="text-sm font-semibold text-[#37352F]">{item.name}</p>
                      <p className="text-sm text-[#6B6B6B] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {s.tips && (
                <ul className="space-y-2">
                  {s.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#37352F]">
                      <span className="text-[#6C5CE7] flex-shrink-0 mt-0.5">&#10003;</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* FAQs */}
              {s.faqs && (
                <div className="space-y-4">
                  {s.faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-xl border border-[#E3E2DE] p-5">
                      <p className="text-sm font-semibold text-[#37352F]">Q. {faq.q}</p>
                      <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">A. {faq.a}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra note */}
              {s.extra && (
                <div className="mt-4 bg-[#FFF9E0] rounded-lg p-4 text-xs text-[#37352F] leading-relaxed whitespace-pre-line">
                  {s.extra}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Back to top */}
        <div className="mt-12 pt-6 border-t border-[#E3E2DE] text-center">
          <Link
            href="/"
            className="text-sm text-[#2383E2] hover:underline"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
