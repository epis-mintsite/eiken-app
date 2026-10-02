import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ミントサイトと共通のFirebaseプロジェクト。これらは公開前提の設定値（秘密情報ではない）。
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
