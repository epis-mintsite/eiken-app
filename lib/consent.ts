import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { TERMS_VERSION } from "@/lib/terms-version";
import { termsCanonicalText } from "@/lib/terms-content";

/** 現行の規約本文のSHA-256（同意した文面を後から特定するための証拠） */
export function currentTermsHash(): string {
  return createHash("sha256").update(termsCanonicalText()).digest("hex");
}

export function clientMeta(req: NextRequest): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");
  return { ip: ip || null, userAgent: req.headers.get("user-agent") };
}

/**
 * 同意履歴を1件追記する（更新・削除はしない）。
 * 同じ利用者が現行の版に同意した記録がすでにあれば、追加しない（版ごとに初回のみ記録）。
 * @param termsHash 利用者が同意した時点の本文ハッシュ（ログイン前同意ではCookieに入っていた値）
 */
export async function recordConsent(params: {
  user: { id: string; login_id: string; name: string };
  source: "pre-login" | "re-consent";
  termsHash: string;
  req: NextRequest;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { user, source, termsHash, req } = params;
  const { ip, userAgent } = clientMeta(req);

  const { data: already } = await supabase
    .from("terms_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("terms_version", TERMS_VERSION)
    .limit(1);
  if (already && already.length > 0) return { ok: true };

  const { error } = await supabase.from("terms_consents").insert({
    user_id: user.id,
    login_id: user.login_id,
    user_name: user.name,
    terms_version: TERMS_VERSION,
    terms_hash: termsHash,
    source,
    ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("terms_consents insert failed:", error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
