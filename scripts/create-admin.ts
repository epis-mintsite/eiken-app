/**
 * 初期管理者ユーザーを作成するスクリプト
 *
 * 使い方:
 *   npx tsx scripts/create-admin.ts <loginId> <password> <name>
 *
 * 例:
 *   npx tsx scripts/create-admin.ts admin password123 管理者
 *
 * 環境変数が必要:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY（DBはRLSで施錠されているため、公開鍵では操作できません）
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です");
  console.error("   .env.local ファイルに設定してください");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const [, , loginId, password, name] = process.argv;

  if (!loginId || !password || !name) {
    console.error("使い方: npx tsx scripts/create-admin.ts <loginId> <password> <name>");
    console.error("例:     npx tsx scripts/create-admin.ts admin password123 管理者");
    process.exit(1);
  }

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(password, 10);

  // ユーザー作成
  const { data, error } = await supabase
    .from("users")
    .insert({
      login_id: loginId,
      password_hash: passwordHash,
      name: name,
      role: "admin",
      is_active: true,
    })
    .select("id, login_id, name, role")
    .single();

  if (error) {
    console.error("❌ ユーザー作成に失敗しました:", error.message);
    process.exit(1);
  }

  console.log("✅ 管理者ユーザーを作成しました:");
  console.log(`   ID:       ${data.id}`);
  console.log(`   ログインID: ${data.login_id}`);
  console.log(`   名前:      ${data.name}`);
  console.log(`   権限:      ${data.role}`);
}

main();
