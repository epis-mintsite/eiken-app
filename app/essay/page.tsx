"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { DocType } from "@/types/essay";
import { DOC_TYPES } from "@/types/essay";
import { DOC_TYPE_CONFIG, measureLength, lengthLabel } from "@/lib/essay/rubrics";
import { compressImage } from "@/lib/image-compress";
import { countIllegible, ILLEGIBLE_MARK, MAX_ESSAY_PHOTOS } from "@/lib/essay/transcript-marks";

const ACCENT = "#1F4E79";

type InputMode = "text" | "photo";
interface Photo {
  file: File;
  url: string;
}

export default function EssayNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user?.role === "teacher" || user?.role === "admin";

  const [docType, setDocType] = useState<DocType | null>(null);
  const [theme, setTheme] = useState("");
  const [text, setText] = useState("");
  const [grade, setGrade] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  // 写真から読み取る
  const [mode, setMode] = useState<InputMode>("text");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reading, setReading] = useState(false);
  const [transcribed, setTranscribed] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  // 画面を離れるときにプレビュー用のURLを解放する
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const cfg = docType ? DOC_TYPE_CONFIG[docType] : null;
  const length = useMemo(
    () => (cfg ? measureLength(text, cfg.lengthUnit) : 0),
    [text, cfg]
  );
  const tooLong = !!cfg && length > cfg.maxLength;
  const illegible = countIllegible(text);
  const showText = mode === "text" || transcribed;
  const busy = loading || reading;
  const canSubmit =
    !!docType && theme.trim() && text.trim() && showText && !tooLong && illegible === 0 && !busy;

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const room = MAX_ESSAY_PHOTOS - photos.length;
    const added = Array.from(list)
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (list.length > room) setError(`写真は${MAX_ESSAY_PHOTOS}枚までです`);
    else setError("");
    setPhotos((prev) => [...prev, ...added]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleTranscribe() {
    if (!docType || photos.length === 0 || reading) return;
    setReading(true);
    setError("");
    setPhotoNote("");
    try {
      const form = new FormData();
      form.append("docType", docType);
      for (const p of photos) {
        // 手書きの細かい字を読むため、通常の答案より少し大きめに残す
        form.append("images", await compressImage(p.file, 2000, 0.85));
      }
      const res = await fetch("/api/essay/transcribe", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "読み取りに失敗しました");
      setText(body.text);
      setPhotoNote(body.note || "");
      setTranscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました");
    } finally {
      setReading(false);
    }
  }

  function retakePhotos() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setTranscribed(false);
    setPhotoNote("");
    setText("");
  }

  async function readStream(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) throw new Error("ストリーミングに対応していません");
    const decoder = new TextDecoder();
    let buffer = "";
    let eventType = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (eventType === "status") setProgress(data.message);
          if (eventType === "error") throw new Error(data.message);
          if (eventType === "result") {
            sessionStorage.setItem("essayResult", JSON.stringify(data));
            router.push(data.id ? `/essay-result/${data.id}` : "/essay-result/local");
            return;
          }
        }
      }
    }
    throw new TypeError("通信が中断されました");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setProgress("送信しています...");
    try {
      const res = await fetch("/api/essay/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          theme,
          text,
          grade,
          studentName,
          sourceType: mode === "photo" && transcribed ? "image" : "text",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "添削に失敗しました");
      }
      await readStream(res);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "通信が中断されました。少し待ってから「履歴」を開くと、結果が保存されている場合があります。"
          : err instanceof Error
            ? err.message
            : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F]">
            エッセイ・志望理由書・作文の添削
          </h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            書いた文章を貼り付けると、観点別の評価・添削・書き直し例・アドバイスが届きます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ① 書類タイプ */}
          <section>
            <h2 className="text-sm font-semibold text-[#37352F] mb-3">① 何を添削しますか？</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DOC_TYPES.map((t) => {
                const c = DOC_TYPE_CONFIG[t];
                const selected = docType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    disabled={busy}
                    className={`text-left rounded-xl border-2 p-4 transition-colors ${
                      selected ? "bg-[#EEF4FA]" : "border-[#E3E2DE] hover:border-[#BFD3E6]"
                    }`}
                    style={selected ? { borderColor: ACCENT } : undefined}
                    aria-pressed={selected}
                  >
                    <p className="font-semibold text-[#37352F]">{c.label}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {cfg && (
            <>
              {/* ② 設問 */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-[#37352F]">② 設問・テーマ</h2>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={busy}
                  placeholder={
                    docType === "english_essay"
                      ? "例: Do you agree that students should have part-time jobs? (120-150 words)"
                      : docType === "jp_personal_statement"
                        ? "例: 本校を志望する理由と、入学後に取り組みたいことを600字以内で書きなさい。"
                        : "例: 「挑戦」をテーマに、自分の体験をふまえて800字以内で書きなさい。"
                  }
                  className="w-full rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                />
                <p className="text-xs text-[#9B9A97]">
                  字数・語数の指定があれば、それも書いてください。
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isStaff && (
                    <input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      maxLength={50}
                      disabled={busy}
                      placeholder={`生徒名（空欄なら ${user?.name ?? ""}）`}
                      className="flex-1 rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                    />
                  )}
                  <input
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    maxLength={20}
                    disabled={busy}
                    placeholder="学年（任意。例: 中3）"
                    className="sm:w-48 rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm focus:outline-none focus:border-[#1F4E79]"
                  />
                </div>
              </section>

              {/* ③ 本文 */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-sm font-semibold text-[#37352F]">③ 本文</h2>
                  <div className="inline-flex rounded-lg border border-[#E3E2DE] overflow-hidden text-sm" role="group" aria-label="本文の入れ方">
                    {([
                      ["text", "文字で入力"],
                      ["photo", "手書きの写真から"],
                    ] as const).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        disabled={busy}
                        aria-pressed={mode === m}
                        className={`px-3 py-1.5 ${mode === m ? "bg-[#EEF4FA] font-semibold" : "bg-white text-[#6B6B6B]"}`}
                        style={mode === m ? { color: ACCENT } : undefined}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === "photo" && !transcribed && (
                  <div className="rounded-xl border-2 border-dashed border-[#BFD3E6] p-4 space-y-3">
                    <p className="text-sm text-[#37352F]">
                      手書きの{cfg.label}を写真に撮ると、AIが文字に起こします。
                      読み取った文章を確認してから添削します（写真は保存しません）。
                    </p>
                    <ul className="text-xs text-[#6B6B6B] list-disc pl-5 space-y-0.5">
                      <li>明るい場所で、紙全体がまっすぐ入るように撮る</li>
                      <li>{MAX_ESSAY_PHOTOS}枚まで（2枚のときは1枚目から順に読みます）</li>
                      <li>名前や先生の書き込みは読み取りません</li>
                    </ul>

                    {photos.length > 0 && (
                      <div className="flex gap-3 flex-wrap">
                        {photos.map((p, i) => (
                          <figure key={p.url} className="relative w-28">
                            {/* eslint-disable-next-line @next/next/no-img-element -- 端末内のプレビュー（object URL） */}
                            <img src={p.url} alt={`${i + 1}枚目の写真`} className="w-28 h-36 object-cover rounded-lg border border-[#E3E2DE]" />
                            <figcaption className="text-xs text-[#6B6B6B] mt-1 text-center">{i + 1}枚目</figcaption>
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              disabled={reading}
                              aria-label={`${i + 1}枚目の写真を外す`}
                              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-[#E3E2DE] text-sm text-[#6B6B6B]"
                            >
                              ×
                            </button>
                          </figure>
                        ))}
                      </div>
                    )}

                    <input
                      ref={cameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={pickerRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        disabled={reading || photos.length >= MAX_ESSAY_PHOTOS}
                        className="rounded-lg border border-[#BFD3E6] bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                        style={{ color: ACCENT }}
                      >
                        カメラで撮る
                      </button>
                      <button
                        type="button"
                        onClick={() => pickerRef.current?.click()}
                        disabled={reading || photos.length >= MAX_ESSAY_PHOTOS}
                        className="rounded-lg border border-[#BFD3E6] bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                        style={{ color: ACCENT }}
                      >
                        写真を選ぶ
                      </button>
                      <button
                        type="button"
                        onClick={handleTranscribe}
                        disabled={reading || photos.length === 0}
                        className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {reading ? "読み取っています..." : "読み取る"}
                      </button>
                    </div>
                    {reading && (
                      <p className="text-xs text-[#9B9A97]">30秒ほどかかります。画面を閉じずにお待ちください。</p>
                    )}
                  </div>
                )}

                {mode === "photo" && transcribed && (
                  <div className="rounded-xl bg-[#EEF4FA] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <p className="text-sm text-[#37352F]">
                        写真から読み取った文章です。<b>写真と見比べて、読みまちがいを直してから</b>添削してください。
                        自分で書いたまちがいは、そのまま残してください（添削で直し方を説明します）。
                      </p>
                      <button
                        type="button"
                        onClick={retakePhotos}
                        disabled={busy}
                        className="text-xs underline text-[#6B6B6B] shrink-0"
                      >
                        写真を撮り直す
                      </button>
                    </div>
                    {photoNote && <p className="text-xs text-[#8A5A00]">写真について: {photoNote}</p>}
                    <div className="flex gap-2 flex-wrap">
                      {photos.map((p, i) => (
                        <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element -- 端末内のプレビュー（object URL） */}
                          <img src={p.url} alt={`${i + 1}枚目の写真（タップで拡大）`} className="w-20 h-24 object-cover rounded-md border border-[#BFD3E6]" />
                        </a>
                      ))}
                      <span className="text-xs text-[#6B6B6B] self-end">写真をタップすると大きく見られます</span>
                    </div>
                  </div>
                )}

                {showText && (
                <>
                <div className="flex justify-end">
                  <span className={`text-xs ${tooLong ? "text-[#C62828] font-semibold" : "text-[#9B9A97]"}`}>
                    {length} / {cfg.maxLength}
                    {lengthLabel(cfg.lengthUnit)}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={14}
                  disabled={busy}
                  placeholder={
                    docType === "english_essay"
                      ? "Write or paste your essay here."
                      : "ここに文章を貼り付けてください。"
                  }
                  className={`w-full rounded-lg border border-[#E3E2DE] px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-[#1F4E79] ${
                    docType === "english_essay" ? "font-serif" : ""
                  }`}
                />
                {tooLong && (
                  <p className="text-xs text-[#C62828] mt-1">
                    {cfg.label}は{cfg.maxLength}
                    {lengthLabel(cfg.lengthUnit)}までです。
                  </p>
                )}
                {illegible > 0 && (
                  <p className="text-xs text-[#C62828] font-semibold">
                    読み取れなかった文字（{ILLEGIBLE_MARK}）があと{illegible}か所あります。写真を見て、正しい文字に直してください。
                  </p>
                )}
                </>
                )}
              </section>

              {error && (
                <div className="rounded-lg border border-[#F3C3BF] bg-[#FDECEA] p-3 text-sm text-[#B3261E]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-lg py-3 text-white font-semibold transition-opacity disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? progress || "添削しています..." : "添削する"}
              </button>
              {loading && (
                <p className="text-xs text-center text-[#9B9A97]">
                  画面を閉じずにお待ちください。
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
