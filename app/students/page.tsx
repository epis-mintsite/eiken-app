"use client";

import { useEffect, useState, useCallback } from "react";

interface Student {
  id: string;
  name: string;
  grade: string | null;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      // skip
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), grade: grade.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "登録に失敗しました");
      }
      setName("");
      setGrade("");
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, studentName: string) {
    if (!confirm(`${studentName}を削除しますか？`)) return;
    try {
      await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchStudents();
    } catch {
      // skip
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352F] tracking-tight">生徒管理</h1>
          <p className="text-sm text-[#9B9A97] mt-1">{students.length}名の生徒</p>
        </div>

        {/* Add form */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] p-6">
          <h2 className="text-lg font-semibold text-[#37352F] mb-4">生徒を登録</h2>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="生徒名 *"
              className="flex-1 min-w-[150px] border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
            />
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="学年（任意）"
              className="w-32 border border-[#C3C2BF] rounded-lg px-3 py-2.5 text-sm text-[#37352F] placeholder:text-[#9B9A97] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
            />
            <button
              type="submit"
              disabled={!name.trim() || adding}
              className="bg-[#6C5CE7] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "登録中..." : "登録"}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-[#EB5757]">{error}</p>}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border border-[#E3E2DE] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#9B9A97]">
              <div className="animate-spin h-6 w-6 border-2 border-[#6C5CE7] border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">読み込み中...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-[#9B9A97]">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm">まだ生徒が登録されていません</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F6F3] text-left text-[#6B6B6B]">
                  <th className="px-4 py-3 font-medium">生徒名</th>
                  <th className="px-4 py-3 font-medium">学年</th>
                  <th className="px-4 py-3 font-medium">登録日</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-[#EEEEEC] last:border-0 hover:bg-[#F7F6F3] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#37352F]">{s.name}</td>
                    <td className="px-4 py-3">
                      {s.grade ? (
                        <span className="bg-[#F3E8FF] text-[#6C5CE7] rounded-md px-2 py-0.5 text-xs font-semibold">
                          {s.grade}
                        </span>
                      ) : (
                        <span className="text-[#9B9A97]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#9B9A97] text-xs">
                      {new Date(s.created_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="text-[#EB5757] hover:opacity-70 text-xs font-medium transition-opacity"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
