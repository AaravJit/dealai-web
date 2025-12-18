// src/lib/dealsDb.ts
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";

export type DealAnalysis = {
  dealScore: number;
  marketValue: number;
  confidence: "low" | "medium" | "high";
  condition: "poor" | "fair" | "good" | "excellent";
  scamFlags: string[];
  negotiationMessage: string;
  reasoning: string[];
};

export type DealDocument = {
  id?: string;
  title: string;
  sellerPrice?: number;
  location?: string;
  imageUrl?: string;
  analysis: DealAnalysis;
  // serverTimestamp() is a FieldValue; once written, Firestore returns a Timestamp.
  createdAt?: Timestamp | FieldValue | null;
};

export async function saveDeal(uid: string, deal: DealDocument): Promise<string> {
  const col = collection(db, "users", uid, "deals");

  const data: Omit<DealDocument, "id"> & { createdAt: Timestamp | FieldValue } = {
    ...deal,
    createdAt: deal.createdAt ?? serverTimestamp(),
  };

  if (deal.id) {
    await setDoc(doc(db, "users", uid, "deals", deal.id), data, { merge: true });
    return deal.id;
  }

  const ref = await addDoc(col, data);
  return ref.id;
}

export async function listDeals(uid: string, take = 50): Promise<DealDocument[]> {
  const ref = collection(db, "users", uid, "deals");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc"), limit(take)));

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      ...(data as DealDocument),
    };
  });
}

export async function refreshDealAnalysis(uid: string, dealId: string, analysis: DealAnalysis) {
  const ref = doc(db, "users", uid, "deals", dealId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    tx.set(
      ref,
      {
        analysis,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
