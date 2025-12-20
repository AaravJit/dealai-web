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
import { stripUndefinedDeep } from "./firestoreClean";

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
  createdAt?: Timestamp | FieldValue | null;
};

export async function saveDeal(uid: string, deal: DealDocument): Promise<string> {
  const col = collection(db, "users", uid, "deals");
  const data = stripUndefinedDeep({
    ...deal,
    createdAt: deal.createdAt ?? serverTimestamp(),
  });

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

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));
}

export async function refreshDealAnalysis(uid: string, dealId: string, analysis: DealAnalysis) {
  const ref = doc(db, "users", uid, "deals", dealId);
  await runTransaction(db, async (tx) => {
    if (!(await tx.get(ref)).exists()) return;
    tx.set(ref, { analysis, updatedAt: serverTimestamp() }, { merge: true });
  });
}
