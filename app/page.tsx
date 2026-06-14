"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TypeStats {
  totalCorrections: number;
  totalStudents: number;
  avgScore: number;
}

interface DashboardStats {
  summary: TypeStats;
  writing: TypeStats;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // DB未接続の場合はスキップ
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function StatRow({ data, label }: { data: TypeStats | undefined; label: string }) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#9B9A97] uppercase tracking-wide">{label}</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#E3E2DE] p-6 text-center">
            <p className="text-3xl font-bold text-[#6C5CE7]">
              {loading ? "—" : data?.totalCorrections ?? 0}
            </p>
            <p className="text-sm text-[#6B6B6B] mt-1">添削件数</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E3E2DE] p-6 text-center">
            <p className="text-3xl font-bold text-[#0D9488]">
              {loading ? "—" : data?.totalStudents ?? 0}
            </p>
            <p className="text-sm text-[#6B6B6B] mt-1">生徒数</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E3E2DE] p-6 text-center">
            <p className="text-3xl font-bold text-[#E67E22]">
              {loading ? "—" : data?.avgScore ?? 0}
            </p>
            <p className="text-sm text-[#6B6B6B] mt-1">平均スコア / 16</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero section */}
      <div className="border-b border-[#E3E2DE] py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#37352F]">
            英検準一級 ライティング添削
          </h1>
          <p className="mt-2 text-sm text-[#9B9A97]">
            手書き答案の自動添削・採点システム
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/correct"
              className="bg-[#6C5CE7] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              新規添削
            </Link>
            <Link
              href="/batch"
              className="border border-[#E3E2DE] text-[#37352F] rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#F7F6F3] transition-colors"
            >
              一括処理
            </Link>
          </div>
          <div className="mt-3">
            <Link
              href="/guide"
              className="text-sm text-[#2383E2] hover:underline transition-colors"
            >
              操作ガイドを見る →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Stats cards */}
        <div className="space-y-6">
          <StatRow data={stats?.summary} label="要約添削" />
          <StatRow data={stats?.writing} label="英作文添削" />
        </div>

        {/* Quick action grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link href="/correct" className="bg-[#F3E8FF] rounded-xl p-5 hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-[#37352F]">英作文添削</p>
            <p className="text-xs text-[#6B6B6B] mt-1">手書き答案を写真から添削</p>
          </Link>
          <Link href="/correct?tab=summary" className="bg-[#E8F4FD] rounded-xl p-5 hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-[#37352F]">要約添削</p>
            <p className="text-xs text-[#6B6B6B] mt-1">英文要約の採点・添削</p>
          </Link>
          <Link href="/batch" className="bg-[#FFF3E8] rounded-xl p-5 hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-[#37352F]">一括処理</p>
            <p className="text-xs text-[#6B6B6B] mt-1">複数答案をまとめて処理</p>
          </Link>
          <Link href="/guide" className="bg-[#F7F6F3] rounded-xl p-5 hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-[#37352F]">操作ガイド</p>
            <p className="text-xs text-[#6B6B6B] mt-1">使い方を確認</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
