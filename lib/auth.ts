import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

export interface AppUser {
  id: string;
  login_id: string;
  name: string;
  role: string;
  is_active: boolean;
}

/**
 * ログインIDとパスワードでユーザーを認証する
 */
export async function authenticateUser(
  loginId: string,
  password: string
): Promise<AppUser> {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, login_id, password_hash, name, role, is_active")
    .eq("login_id", loginId)
    .single();

  if (error || !user) {
    throw new Error("ログインIDまたはパスワードが正しくありません");
  }

  if (!user.is_active) {
    throw new Error("このアカウントは無効化されています");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("ログインIDまたはパスワードが正しくありません");
  }

  return {
    id: user.id,
    login_id: user.login_id,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
  };
}

/**
 * パスワードをハッシュ化する
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * パスワードを検証する
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
