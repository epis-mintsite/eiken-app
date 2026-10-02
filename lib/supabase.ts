import "server-only";
import { createClient } from "@supabase/supabase-js";

// DBへのアクセスはすべてサーバー（APIルート）経由で行い、service role キーを使う。
// 公開鍵（NEXT_PUBLIC_*_ANON_KEY）はブラウザに配信されるため、DBアクセスには使用しない。
// （テーブルはRLS有効・ポリシーなしで、anon からは一切読み書きできない）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (supabaseUrl && !serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY が未設定です。DBにアクセスできません。");
}

export const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : (null as unknown as ReturnType<typeof createClient>);
