// client/src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ← アナリティクスではなくデータベースを読み込む

// ご自身のFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyD37Bf_f5X61plqAgauVZE8CvtOcjE12oU",
  authDomain: "the-economist-826ed.firebaseapp.com",
  projectId: "the-economist-826ed",
  storageBucket: "the-economist-826ed.firebasestorage.app",
  messagingSenderId: "315552233304",
  appId: "1:315552233304:web:80ec44bfd35a51a6d7d72d",
  measurementId: "G-LCD41EDM3Z"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// データベース（Firestore）を初期化してエクスポート
export const db = getFirestore(app);
