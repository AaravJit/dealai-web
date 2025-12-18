import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// dataUrl should be "data:image/...;base64,...."
export async function uploadDealImage(uid: string, dataUrl: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const path = `users/${uid}/deals/${id}.jpg`;
  const r = ref(storage, path);

  // Upload base64 data URL directly
  await uploadString(r, dataUrl, "data_url");

  // Return a CDN-backed download URL
  return await getDownloadURL(r);
}
