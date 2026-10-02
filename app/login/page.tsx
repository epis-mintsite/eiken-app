"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase-client";

type Mode = "epis" | "admin";

// Firebaseのエラーコード → 利用者向けメッセージ
function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-email":
      return "IDまたはパスワードが正しくありません。";
    case "auth/too-many-requests":
      return "試行回数が多すぎます。しばらくしてから、もう一度お試しください。";
    case "auth/network-request-failed":
      return "通信エラーが発生しました。接続をご確認ください。";
    case "auth/user-disabled":
      return "このアカウントは無効化されています。";
    default:
      return `ログインに失敗しました（${code || "不明なエラー"}）`;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithEpis } = useAuth();
  const [mode, setMode] = useState<Mode>("epis");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setLoginId("");
    setPassword("");
    setError("");
  }

  // ミントサイトと同じ入力ルール
  function validateEpis(): string | null {
    if (/\s/.test(loginId)) return "IDにスペースは使用できません。";
    if (!/^[a-zA-Z0-9]+$/.test(loginId)) return "IDはアルファベットと数字のみ使用できます。";
    if (/\s/.test(password)) return "パスワードにスペースは使用できません。";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "epis") {
      const invalid = validateEpis();
      if (invalid) {
        setError(invalid);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "epis") {
        // ミントサイトと同じ形式でFirebase認証（パスワードはブラウザとFirebaseの間でのみ扱われる）
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, `${loginId}@example.com`, password);
        const idToken = await credential.user.getIdToken();
        await signOut(auth); // トークンは取得済み。ブラウザにFirebaseのログイン状態は残さない
        await loginWithEpis(idToken);
      } else {
        await login(loginId, password);
      }
      router.push("/");
    } catch (err) {
      // 規約への同意の有効期限（24時間）が切れた場合は、規約ページへ戻す
      const code = (err as { code?: string }).code;
      if (code === "TERMS_REQUIRED") {
        window.location.href = "/terms";
        return;
      }
      setError(
        code?.startsWith("auth/")
          ? firebaseErrorMessage(code)
          : err instanceof Error
            ? err.message
            : "ログインに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }

  const isEpis = mode === "epis";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">
            上級ライティング添削
          </h1>
          <p className="text-sm text-[#9B9A97] mt-1">
            {isEpis ? "ミントサイトのIDとパスワードでログイン" : "管理者ログイン"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E3E2DE] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                {isEpis ? "ミントサイトのID" : "ログインID"}
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoComplete="username"
                autoCapitalize="none"
                placeholder="IDを入力"
                className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="パスワードを入力"
                className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !loginId.trim() || !password}
              className="w-full bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#5A4BD1] disabled:bg-[#CFCDC9] disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-[#9B9A97] text-center mt-4">
          {isEpis ? (
            <>
              ミントサイトと同じIDとパスワードを使います
              <br />
              <button
                type="button"
                onClick={() => switchMode("admin")}
                className="mt-2 underline hover:text-[#6B6B6B]"
              >
                管理者ログインはこちら
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("epis")}
              className="underline hover:text-[#6B6B6B]"
            >
              ミントサイトのIDでログインする
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
