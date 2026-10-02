import Link from "next/link";
import { getSession } from "@/lib/session";
import { TERMS_VERSION } from "@/lib/terms-version";
import { TERMS_TITLE, TERMS_SECTIONS } from "@/lib/terms-content";
import TermsForm from "@/components/TermsForm";

export const metadata = { title: "利用規約" };

export default async function TermsPage() {
  const session = await getSession();
  // 未ログイン → 初回同意 / ログイン中で版が古い → 再同意 / 同意済み → 閲覧のみ
  const mode = !session
    ? "pre-login"
    : session.termsVersion === TERMS_VERSION
      ? "view"
      : "reconsent";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[#37352F]">
          {TERMS_TITLE}
        </h1>
        <p className="mt-1 text-sm text-[#9B9A97]">
          {mode === "pre-login"
            ? "ご利用の前に、次の利用規約をお読みください。同意いただくとログイン画面に進めます。"
            : "AIライティング添削の利用規約です。"}
          （版：{TERMS_VERSION}）
        </p>

        <div className="mt-6 border border-[#E3E2DE] rounded-xl p-6 max-h-[55vh] overflow-y-auto space-y-6 bg-[#FBFBFA]">
          {TERMS_SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm font-semibold text-[#37352F] mb-2">{s.heading}</h2>
              <div className="space-y-1.5">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-[#37352F] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {mode === "view" ? (
          <p className="mt-6 text-sm text-[#6B6B6B]">
            この版の利用規約に同意済みです。{" "}
            <Link href="/" className="text-[#2383E2] hover:underline">
              ホームに戻る
            </Link>
          </p>
        ) : (
          <TermsForm mode={mode} />
        )}
      </div>
    </div>
  );
}
