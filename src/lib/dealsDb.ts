// src/lib/dealsDb.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";

export type DealResult = {
  id?: string;

  title: string;
  sellerPrice: number;
  marketValue: number;
  counterOffer: number;
  dealScore: number;

  condition: string; // "Excellent" | "Good" | "Fair" | "Poor" | "Unknown"
  scamRisk: string; // "Low" | "Medium" | "High"
  location: string;

  notes: string[];

  imageUrl?: string;

  // UI-only (never store in Firestore)
  imageDataUrl?: string;

  createdAt?: Timestamp | null;
};

export async function saveToTimeline(
  uid: string,
  deal: Omit<DealResult, "id" | "imageDataUrl"> & { imageUrl?: string }
) {
  const ref = collection(db, "users", uid, "timeline");

  // Never store base64
  const { imageDataUrl, ...rest } = deal as DealResult & {
    imageDataUrl?: string;
  };

  await addDoc(ref, {
    ...rest,
    createdAt: serverTimestamp(),
  });
}

export async function listTimeline(uid: string): Promise<(DealResult & { id: string })[]> {
  const ref = collection(db, "users", uid, "timeline");

  // Order newest first (requires createdAt on docs; saveToTimeline sets it)
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      ...(data as DealResult),
    };
  });
}
