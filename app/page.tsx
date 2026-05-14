"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalCorrections: number;
  totalStudents: number;
  avgScore: number;
  recentCorrections: {
    id: string;
    student_name: string;
    topic: string;
    score_total: number;
    corrected_at: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/history?limit=5");
        if (res.ok) {
          const data = await res.json();
          const corrections = data.corrections || [];
          const students = new Set(corrections.map((c: { student_name: string }) => c.student_name));
          const totalScore = corrections.reduce(
            (sum: number, c: { score_total: number }) => sum + (c.score_total || 0),
            0
          );
          setStats({
            totalCorrections: data.total || corrections.length,
            totalStudents: students.size,
            avgScore: corrections.length > 0 ? Math.round((totalScore / corrections.length) * 10) / 10 : 0,
            recentCorrections: corrections.slice(0, 5),
          });
        }
      } catch {
        // DB未接続の場合はスキップ
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">英検準一級 ライティング添削アプリ</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/upload"
            className="bg-blue-600 text-white rounded-xl p-4 text-center hover:bg-blue-700 transition-colors"
          >
            <div className="text-2xl mb-1">📷</div>
            <div className="text-sm font-medium">新規添削</div>
          </Link>
          <Link
            href="/batch"
            className="bg-purple-600 text-white rounded-xl p-4 text-center hover:bg-purple-700 transition-colors"
          >
            <div className="text-2xl mb-1">📦</div>
            <div className="text-sm font-medium">一括処理</div>
          </Link>
          <Link
            href="/history"
            className="bg-green-600 text-white rounded-xl p-4 text-center hover:bg-green-700 transition-colors"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-sm font-medium">添削履歴</div>
          </Link>
          <Link
            href="/students"
            className="bg-orange-600 text-white rounded-xl p-4 text-center hover:bg-orange-700 transition-colors"
          >
            <div className="text-2xl mb-1">👤</div>
            <div className="text-sm font-medium">生徒管理</div>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {loading ? "—" : stats?.totalCorrections ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">添削件数</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">
              {loading ? "—" : stats?.totalStudents ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">生徒数</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {loading ? "—" : stats?.avgScore ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">平均スコア / 16</p>
          </div>
        </div>

        {/* Recent corrections */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">最近の添削</h2>
            <Link href="/history" className="text-sm text-blue-600 hover:underline">
              すべて見る →
            </Link>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">読み込み中...</p>
          ) : stats && stats.recentCorrections.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCorrections.map((c) => (
                <Link
                  key={c.id}
                  href={`/result/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">{c.student_name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">{c.topic}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{c.score_total}/16</p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.corrected_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">まだ添削データがありません</p>
              <Link href="/upload" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                最初の添削を始める →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
