import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

export type QuotaState = {
  day: string;
  uploadsUsed: number;
  uploadsLimit: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isPro: boolean;
  plan: "free" | "pro";
  quota?: QuotaState;
};

const FREE_LIMIT = 3;
const PRO_LIMIT = 10000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizePlan(raw: unknown, isPro: boolean): "free" | "pro" {
  if (raw === "pro") return "pro";
  if (raw === "free") return "free";
  return isPro ? "pro" : "free";
}

export async function refreshQuota(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as Partial<UserProfile> & { quota?: Partial<QuotaState> };
    const isPro = Boolean(data.isPro);
    const plan = normalizePlan(data.plan, isPro);
    const baseLimit = data.quota?.uploadsLimit ?? (plan === "pro" ? PRO_LIMIT : FREE_LIMIT);

    let quota: QuotaState = {
      day: data.quota?.day ?? today(),
      uploadsUsed: data.quota?.uploadsUsed ?? 0,
      uploadsLimit: baseLimit,
    };

    if (quota.day !== today()) {
      quota = {
        day: today(),
        uploadsUsed: 0,
        uploadsLimit: plan === "pro" ? PRO_LIMIT : baseLimit,
      };
    }

    tx.set(
      ref,
      {
        plan,
        isPro,
        quota,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      uid,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      photoURL: data.photoURL ?? "",
      isPro,
      plan,
      quota,
    } satisfies UserProfile;
  });

  return result;
}

export async function consumeUpload(uid: string): Promise<{ blocked: boolean; profile: UserProfile | null }> {
  const ref = doc(db, "users", uid);

  const profile = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as Partial<UserProfile> & { quota?: Partial<QuotaState> };
    const isPro = Boolean(data.isPro);
    const plan = normalizePlan(data.plan, isPro);

    const baseLimit = data.quota?.uploadsLimit ?? (plan === "pro" ? PRO_LIMIT : FREE_LIMIT);
    const resetLimit = plan === "pro" ? PRO_LIMIT : baseLimit;
    const lastDay = data.quota?.day ?? today();
    const sameDay = lastDay === today();

    const used = sameDay ? data.quota?.uploadsUsed ?? 0 : 0;
    const limit = resetLimit;

    const blocked = plan !== "pro" && used >= limit;

    const nextQuota: QuotaState = {
      day: today(),
      uploadsUsed: blocked ? used : used + 1,
      uploadsLimit: limit,
    };

    tx.set(
      ref,
      {
        plan,
        isPro,
        quota: nextQuota,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      uid,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      photoURL: data.photoURL ?? "",
      isPro,
      plan,
      quota: nextQuota,
    } satisfies UserProfile;
  });

  if (!profile) return { blocked: true, profile: null };

  return {
    blocked:
      profile.plan !== "pro" && (profile.quota?.uploadsUsed ?? 0) >= (profile.quota?.uploadsLimit ?? FREE_LIMIT),
    profile,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserProfile> & { quota?: Partial<QuotaState> };
  const isPro = Boolean(data.isPro);
  const plan = normalizePlan(data.plan, isPro);
  const quota: QuotaState | undefined = data.quota
    ? {
        day: data.quota.day ?? today(),
        uploadsUsed: data.quota.uploadsUsed ?? 0,
        uploadsLimit: data.quota.uploadsLimit ?? (plan === "pro" ? PRO_LIMIT : FREE_LIMIT),
      }
    : undefined;

  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? "",
    isPro,
    plan,
    quota,
  };
}
