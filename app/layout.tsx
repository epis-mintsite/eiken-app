import type { Metadata } from "next";
import Link from "next/link";
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
          <footer className="border-t border-[#E3E2DE] py-5 bg-white">
            <div className="max-w-4xl mx-auto px-4 text-xs text-[#9B9A97] text-center">
              <Link href="/terms" className="hover:underline">
                利用規約
              </Link>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
