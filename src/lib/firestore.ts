import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// --- Users ---
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "ddUsers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createOrUpdateUser(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(db, "ddUsers", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

// --- Prompts ---
export async function getPrompts() {
  const q = query(collection(db, "ddPrompts"), orderBy("sortOrder", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPrompt(id: string) {
  const snap = await getDoc(doc(db, "ddPrompts", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createPrompt(id: string, data: Record<string, unknown>) {
  await setDoc(doc(db, "ddPrompts", id), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updatePrompt(id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "ddPrompts", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deletePrompt(id: string) {
  await deleteDoc(doc(db, "ddPrompts", id));
}

// --- Reports ---
export async function getUserReports(userId: string) {
  const q = query(
    collection(db, "ddReports"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllReports() {
  const q = query(collection(db, "ddReports"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSampleReports() {
  const q = query(
    collection(db, "ddReports"),
    where("isSample", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getReport(id: string) {
  const snap = await getDoc(doc(db, "ddReports", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createReport(data: Record<string, unknown>) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "ddReports", id), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id, ...data };
}

export async function updateReport(id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "ddReports", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// --- FollowUps ---
export async function getFollowUps(reportId: string) {
  const q = query(
    collection(db, "ddFollowUps"),
    where("reportId", "==", reportId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createFollowUp(data: Record<string, unknown>) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "ddFollowUps", id), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return { id, ...data };
}

// --- Site Settings ---
export async function getSiteSettings() {
  const snap = await getDoc(doc(db, "ddSettings", "singleton"));
  if (!snap.exists()) {
    return {
      defaultAiModel: "claude-sonnet-4-6",
      anthropicApiKey: "",
      openaiApiKey: "",
      googleApiKey: "",
      maxOutputTokens: 16000,
    };
  }
  return snap.data();
}

export async function updateSiteSettings(data: Record<string, unknown>) {
  await setDoc(doc(db, "ddSettings", "singleton"), {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

// --- Subscriptions ---
export async function getSubscription(userId: string) {
  const snap = await getDoc(doc(db, "ddSubscriptions", userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function upsertSubscription(userId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, "ddSubscriptions", userId), {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}
