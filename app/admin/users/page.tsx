"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  login_id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  consent: { terms_version: string; agreed_at: string } | null;
}

function consentLabel(user: User, currentVersion: string) {
  if (!user.consent) return { text: "未同意", ok: false };
  const d = new Date(user.consent.agreed_at).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const ok = user.consent.terms_version === currentVersion;
  return { text: `${d}（版 ${user.consent.terms_version}）${ok ? "" : "・要再同意"}`, ok };
}

type ModalType = "add" | "edit" | "resetPassword" | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentTermsVersion, setCurrentTermsVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formLoginId, setFormLoginId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/users${params}`);
      if (!res.ok) throw new Error("取得に失敗しました");
      const data = await res.json();
      setUsers(data.users);
      setCurrentTermsVersion(data.currentTermsVersion || "");
    } catch {
      setError("ユーザー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function openAddModal() {
    setFormLoginId("");
    setFormName("");
    setFormPassword("");
    setFormRole("user");
    setError("");
    setModal("add");
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setError("");
    setModal("edit");
  }

  function openResetPasswordModal(user: User) {
    setSelectedUser(user);
    setFormPassword("");
    setError("");
    setModal("resetPassword");
  }

  function closeModal() {
    setModal(null);
    setSelectedUser(null);
    setError("");
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: formLoginId,
          password: formPassword,
          name: formName,
          role: formRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      closeModal();
      showSuccess("ユーザーを追加しました");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setFormLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, role: formRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      closeModal();
      showSuccess("ユーザー情報を更新しました");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setFormLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/users/${selectedUser.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: formPassword }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      closeModal();
      showSuccess("パスワードをリセットしました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "リセットに失敗しました");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(user: User) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showSuccess(
        user.is_active ? "アカウントを無効化しました" : "アカウントを有効化しました"
      );
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#37352F]">
            ユーザー管理
          </h1>
          <p className="text-[#6B6B6B] mt-2 text-sm">
            登録済みユーザーの追加・編集・無効化
          </p>
        </div>

        {/* Success / Error */}
        {success && (
          <div className="mb-4 bg-[#DBEDDB] border border-[#4CAF50]/30 text-[#2E7D32] rounded-lg p-3 text-sm">
            {success}
          </div>
        )}
        {error && !modal && (
          <div className="mb-4 bg-[#FFF3E8] border border-[#EB5757]/30 text-[#EB5757] rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Search + Add */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ユーザーを検索..."
              className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
            />
          </div>
          <a
            href="/api/admin/consents"
            className="border border-[#E3E2DE] text-[#37352F] rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#F7F6F3] transition-colors whitespace-nowrap"
          >
            同意履歴をCSV出力
          </a>
          <button
            onClick={openAddModal}
            className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#5A4BD1] transition-colors whitespace-nowrap"
          >
            ＋ 新規追加
          </button>
        </div>

        {/* User table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#6C5CE7] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E3E2DE] overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E3E2DE] bg-[#FBFBFA]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      ログインID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      名前
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      権限
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      状態
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      規約への同意
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#9B9A97] uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#E3E2DE] last:border-0 hover:bg-[#FBFBFA] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-[#37352F] font-mono">
                        {user.login_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#37352F]">
                        {user.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-[#6C5CE7]/10 text-[#6C5CE7]"
                              : user.role === "user"
                              ? "bg-[#0D9488]/10 text-[#0D9488]"
                              : "bg-[#E3E2DE] text-[#6B6B6B]"
                          }`}
                        >
                          {user.role === "admin" ? "管理者" : user.role === "user" ? "生徒" : "先生"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                            user.is_active ? "bg-[#4CAF50]" : "bg-[#9B9A97]"
                          }`}
                        />
                        <span className="text-sm text-[#6B6B6B]">
                          {user.is_active ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={consentLabel(user, currentTermsVersion).ok ? "text-[#4CAF50]" : "text-[#E67E22]"}>
                          {consentLabel(user, currentTermsVersion).text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-2 py-1 text-xs text-[#6B6B6B] hover:text-[#37352F] hover:bg-[#F1F1EF] rounded transition-colors"
                            title="編集"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="px-2 py-1 text-xs text-[#6B6B6B] hover:text-[#37352F] hover:bg-[#F1F1EF] rounded transition-colors"
                            title="パスワードリセット"
                          >
                            PW
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              user.is_active
                                ? "text-[#EB5757] hover:bg-[#EB5757]/5"
                                : "text-[#4CAF50] hover:bg-[#4CAF50]/5"
                            }`}
                            title={user.is_active ? "無効化" : "有効化"}
                          >
                            {user.is_active ? "無効化" : "有効化"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[#E3E2DE]">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#37352F]">
                        {user.name}
                      </span>
                      <span className="ml-2 text-xs text-[#9B9A97] font-mono">
                        {user.login_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-[#6C5CE7]/10 text-[#6C5CE7]"
                            : "bg-[#E3E2DE] text-[#6B6B6B]"
                        }`}
                      >
                        {user.role === "admin" ? "管理者" : user.role === "user" ? "生徒" : "先生"}
                      </span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          user.is_active ? "bg-[#4CAF50]" : "bg-[#9B9A97]"
                        }`}
                      />
                    </div>
                  </div>
                  <p className={`text-xs ${consentLabel(user, currentTermsVersion).ok ? "text-[#4CAF50]" : "text-[#E67E22]"}`}>
                    規約：{consentLabel(user, currentTermsVersion).text}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 px-3 py-1.5 text-xs text-center text-[#6B6B6B] border border-[#E3E2DE] rounded-lg hover:bg-[#F7F6F3] transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => openResetPasswordModal(user)}
                      className="flex-1 px-3 py-1.5 text-xs text-center text-[#6B6B6B] border border-[#E3E2DE] rounded-lg hover:bg-[#F7F6F3] transition-colors"
                    >
                      PW リセット
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`flex-1 px-3 py-1.5 text-xs text-center border rounded-lg transition-colors ${
                        user.is_active
                          ? "text-[#EB5757] border-[#EB5757]/30 hover:bg-[#EB5757]/5"
                          : "text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/5"
                      }`}
                    >
                      {user.is_active ? "無効化" : "有効化"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-[#9B9A97]">
                {search
                  ? "検索条件に一致するユーザーがいません"
                  : "ユーザーが登録されていません"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl border border-[#E3E2DE] shadow-lg w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add user modal */}
            {modal === "add" && (
              <form onSubmit={handleAddUser} className="space-y-4">
                <h2 className="text-lg font-semibold text-[#37352F]">
                  新規ユーザー追加
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    ログインID <span className="text-[#EB5757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formLoginId}
                    onChange={(e) => setFormLoginId(e.target.value)}
                    required
                    placeholder="teacher1"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    名前 <span className="text-[#EB5757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="山田先生"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    初期パスワード <span className="text-[#EB5757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="6文字以上"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    権限
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formRole === "user"}
                        onChange={() => setFormRole("user")}
                        className="accent-[#6C5CE7]"
                      />
                      生徒
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="teacher"
                        checked={formRole === "teacher"}
                        onChange={() => setFormRole("teacher")}
                        className="accent-[#6C5CE7]"
                      />
                      先生
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={formRole === "admin"}
                        onChange={() => setFormRole("admin")}
                        className="accent-[#6C5CE7]"
                      />
                      管理者
                    </label>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A4BD1] disabled:bg-[#CFCDC9] transition-colors"
                  >
                    {formLoading ? "追加中..." : "追加する"}
                  </button>
                </div>
              </form>
            )}

            {/* Edit user modal */}
            {modal === "edit" && selectedUser && (
              <form onSubmit={handleEditUser} className="space-y-4">
                <h2 className="text-lg font-semibold text-[#37352F]">
                  ユーザー編集
                </h2>
                <p className="text-sm text-[#9B9A97]">
                  ログインID: {selectedUser.login_id}
                </p>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    名前
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    権限
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="user"
                        checked={formRole === "user"}
                        onChange={() => setFormRole("user")}
                        className="accent-[#6C5CE7]"
                      />
                      生徒
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="teacher"
                        checked={formRole === "teacher"}
                        onChange={() => setFormRole("teacher")}
                        className="accent-[#6C5CE7]"
                      />
                      先生
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#37352F] cursor-pointer">
                      <input
                        type="radio"
                        name="editRole"
                        value="admin"
                        checked={formRole === "admin"}
                        onChange={() => setFormRole("admin")}
                        className="accent-[#6C5CE7]"
                      />
                      管理者
                    </label>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A4BD1] disabled:bg-[#CFCDC9] transition-colors"
                  >
                    {formLoading ? "更新中..." : "更新する"}
                  </button>
                </div>
              </form>
            )}

            {/* Reset password modal */}
            {modal === "resetPassword" && selectedUser && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <h2 className="text-lg font-semibold text-[#37352F]">
                  パスワードリセット
                </h2>
                <p className="text-sm text-[#9B9A97]">
                  {selectedUser.name}（{selectedUser.login_id}）
                </p>

                <div>
                  <label className="block text-sm font-medium text-[#37352F] mb-1.5">
                    新しいパスワード <span className="text-[#EB5757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="6文字以上"
                    className="w-full border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder-[#B4B4B0] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-[#9B9A97] mt-1">
                    設定後、本人にパスワードをお伝えください
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-[#EB5757] bg-[#EB5757]/5 rounded-lg p-2.5">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#37352F] transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A4BD1] disabled:bg-[#CFCDC9] transition-colors"
                  >
                    {formLoading ? "リセット中..." : "リセットする"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
