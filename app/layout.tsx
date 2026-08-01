import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "上級ライティング添削",
  description: "手書き答案の写真をアップロードして自動添削・採点",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#E3E2DE] py-6 bg-white">
            <div className="max-w-4xl mx-auto px-4 text-xs text-[#9B9A97] leading-relaxed space-y-1">
              <p>
                本サービスは、公益財団法人 日本英語検定協会とは無関係であり、同協会の承認・推奨を受けたものではありません。
              </p>
              <p>英検®は、公益財団法人 日本英語検定協会の登録商標です。</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
