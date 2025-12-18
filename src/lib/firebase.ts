import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPfxxy4Ia9rQtfTZf6Lg-6UGqKzRV79ng",
  authDomain: "dealai-8f3a2.firebaseapp.com",
  projectId: "dealai-8f3a2",
  storageBucket: "dealai-8f3a2.firebasestorage.app",
  messagingSenderId: "890679728390",
  appId: "1:890679728390:web:4c14a10d94d449d422e687"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);