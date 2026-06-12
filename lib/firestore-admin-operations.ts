import { dbAdmin } from "./firebase-admin";
import type { Article, Category, Magazine, MagazinePageTranslation } from "./types";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  getArticles,
  getMagazines,
  getCategories,
  checkArticleExistsByOriginalId,
  saveAggregatedArticle,
  seedCategories,
  getMagazinePageTranslation,
  saveMagazinePageTranslation,
  updateMagazineTranslationStatus
} from "./firestore";

let authPromise: Promise<void> | null = null;

async function ensureClientAuth() {
  if (auth.currentUser) return;
  if (authPromise) return authPromise;

  authPromise = signInWithEmailAndPassword(auth, "local-test-admin@kammavoice.com", "TestPassword123!")
    .then((user) => {
      console.log("[Firestore Client Auth] Authenticated local test user:", user.user.uid);
      authPromise = null;
    })
    .catch((err) => {
      authPromise = null;
      console.error("[Firestore Client Auth] Failed to authenticate local test user:", err);
      throw err;
    });
  return authPromise;
}

function isCredentialsAvailable(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  // Fall back to client SDK on local environment builds when no admin credentials exist
  if (process.env.VERCEL === "1") return true;
  return false;
}

export async function adminGetArticles(maxCount = 50): Promise<Article[]> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminGetArticles.");
    try {
      await ensureClientAuth();
      return getArticles(maxCount);
    } catch (err) {
      console.error("[Firestore Admin fallback] adminGetArticles failed:", err);
      return [];
    }
  }
  try {
    const snap = await dbAdmin.collection("articles")
      .where("isPublished", "==", true)
      .orderBy("createdAt", "desc")
      .limit(maxCount)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
  } catch (err) {
    console.warn("[Firestore Admin] adminGetArticles failed. Falling back to in-memory sorting:", err);
    try {
      const snap = await dbAdmin.collection("articles")
        .where("isPublished", "==", true)
        .get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore Admin] adminGetArticles fallback failed:", fallbackErr);
      return [];
    }
  }
}

export async function adminGetMagazines(maxCount = 20): Promise<Magazine[]> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminGetMagazines.");
    try {
      await ensureClientAuth();
      return getMagazines(maxCount);
    } catch (err) {
      console.error("[Firestore Admin fallback] adminGetMagazines failed:", err);
      return [];
    }
  }
  try {
    const snap = await dbAdmin.collection("magazines")
      .where("isPublished", "==", true)
      .orderBy("createdAt", "desc")
      .limit(maxCount)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Magazine));
  } catch (err) {
    console.warn("[Firestore Admin] adminGetMagazines failed. Falling back to in-memory sorting:", err);
    try {
      const snap = await dbAdmin.collection("magazines")
        .where("isPublished", "==", true)
        .get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Magazine));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore Admin] adminGetMagazines fallback failed:", fallbackErr);
      return [];
    }
  }
}

export async function adminGetCategories(): Promise<Category[]> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminGetCategories.");
    try {
      await ensureClientAuth();
      return getCategories();
    } catch (err) {
      console.error("[Firestore Admin fallback] adminGetCategories failed:", err);
      return [];
    }
  }
  try {
    const snap = await dbAdmin.collection("categories")
      .orderBy("name", "asc")
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (err) {
    console.error("[Firestore Admin] adminGetCategories error:", err);
    return [];
  }
}

export async function adminCheckArticleExistsByOriginalId(originalId: string, sourceUrl?: string): Promise<boolean> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminCheckArticleExistsByOriginalId.");
    try {
      await ensureClientAuth();
      return checkArticleExistsByOriginalId(originalId, sourceUrl);
    } catch (err: any) {
      console.error("[Firestore Admin fallback] adminCheckArticleExistsByOriginalId failed:", err.stack || err);
      return false;
    }
  }
  try {
    const snap = await dbAdmin.collection("articles")
      .where("isAggregated", "==", true)
      .where("originalId", "==", originalId)
      .limit(1)
      .get();
    if (!snap.empty) return true;

    if (sourceUrl) {
      const snap2 = await dbAdmin.collection("articles")
        .where("isAggregated", "==", true)
        .where("sourceUrl", "==", sourceUrl)
        .limit(1)
        .get();
      if (!snap2.empty) return true;
    }
    return false;
  } catch (error) {
    console.error("[Firestore Admin] Error in adminCheckArticleExistsByOriginalId:", error);
    return false;
  }
}

export async function adminSaveAggregatedArticle(articleData: Partial<Article>): Promise<string> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminSaveAggregatedArticle.");
    try {
      await ensureClientAuth();
      return saveAggregatedArticle(articleData);
    } catch (err: any) {
      console.error("[Firestore Admin fallback] adminSaveAggregatedArticle failed:", err.stack || err);
      throw err;
    }
  }
  try {
    const data = {
      ...articleData,
      isAggregated: true,
      approvalStatus: articleData.approvalStatus || "pending",
      isPublished: articleData.isPublished ?? (articleData.approvalStatus === "auto-published"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await dbAdmin.collection("articles").add(data);
    return docRef.id;
  } catch (error) {
    console.error("[Firestore Admin] Error in adminSaveAggregatedArticle:", error);
    throw error;
  }
}

export async function adminSeedCategories(): Promise<void> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminSeedCategories.");
    try {
      await ensureClientAuth();
      await seedCategories();
    } catch (err: any) {
      console.error("[Firestore Admin fallback] adminSeedCategories failed:", err.stack || err);
    }
    return;
  }
  try {
    const existing = await dbAdmin.collection("categories").limit(1).get();
    if (!existing.empty) return; // already seeded

    const defaults: Omit<Category, "id">[] = [
      { name: "Politics", nameTelugu: "రాజకీయాలు", slug: "politics", articleCount: 0, color: "#C9A84C" },
      { name: "Business", nameTelugu: "వ్యాపారం", slug: "business", articleCount: 0, color: "#4AD98B" },
      { name: "Agriculture", nameTelugu: "వ్యవసాయం", slug: "agriculture", articleCount: 0, color: "#E67E22" },
      { name: "Education", nameTelugu: "విద్య", slug: "education", articleCount: 0, color: "#9B59B6" },
      { name: "Kamma Community", nameTelugu: "కమ్మ సమాజం", slug: "kamma-community", articleCount: 0, color: "#4A90D9" },
      { name: "Andhra Pradesh Development", nameTelugu: "ఆంధ్రప్రదేశ్ అభివృద్ధి", slug: "ap-development", articleCount: 0, color: "#D94A6B" },
    ];

    const batch = dbAdmin.batch();
    for (const cat of defaults) {
      const docRef = dbAdmin.collection("categories").doc();
      batch.set(docRef, cat);
    }
    await batch.commit();
    console.log("[Firebase Admin] Categories seeded successfully.");
  } catch (error) {
    console.error("[Firestore Admin] Error seeding categories via Admin SDK:", error);
  }
}

export async function adminGetMagazinePageTranslation(magazineId: string, pageNumber: number): Promise<MagazinePageTranslation | null> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminGetMagazinePageTranslation.");
    try {
      await ensureClientAuth();
      return getMagazinePageTranslation(magazineId, pageNumber);
    } catch (err) {
      console.error("[Firestore Admin fallback] adminGetMagazinePageTranslation failed:", err);
      return null;
    }
  }
  try {
    const docRef = dbAdmin.collection("magazines").doc(magazineId).collection("pages").doc(pageNumber.toString());
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as MagazinePageTranslation;
  } catch (error) {
    console.error(`[Firestore Admin] Error in adminGetMagazinePageTranslation for mag ${magazineId} page ${pageNumber}:`, error);
    return null;
  }
}

export async function adminSaveMagazinePageTranslation(
  magazineId: string,
  pageNumber: number,
  data: Partial<MagazinePageTranslation>
): Promise<void> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminSaveMagazinePageTranslation.");
    try {
      await ensureClientAuth();
      await saveMagazinePageTranslation(magazineId, pageNumber, data);
    } catch (err) {
      console.error("[Firestore Admin fallback] adminSaveMagazinePageTranslation failed:", err);
      throw err;
    }
    return;
  }
  try {
    const docRef = dbAdmin.collection("magazines").doc(magazineId).collection("pages").doc(pageNumber.toString());
    const payload = {
      pageNumber,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await docRef.set(payload, { merge: true });
  } catch (error) {
    console.error(`[Firestore Admin] Error in adminSaveMagazinePageTranslation for mag ${magazineId} page ${pageNumber}:`, error);
    throw error;
  }
}

export async function adminUpdateMagazineTranslationStatus(
  magazineId: string,
  statusUpdate: Partial<Magazine['translationStatus']>
): Promise<void> {
  if (!isCredentialsAvailable()) {
    console.log("[Firestore Admin] No admin credentials. Using Client SDK fallback for adminUpdateMagazineTranslationStatus.");
    try {
      await ensureClientAuth();
      await updateMagazineTranslationStatus(magazineId, statusUpdate);
    } catch (err) {
      console.error("[Firestore Admin fallback] adminUpdateMagazineTranslationStatus failed:", err);
      throw err;
    }
    return;
  }
  try {
    const magRef = dbAdmin.collection("magazines").doc(magazineId);
    const snap = await magRef.get();
    if (!snap.exists) return;
    
    const data = snap.data() || {};
    const currentStatus = data.translationStatus || {
      totalTranslatedPages: 0,
      lastTranslatedPage: 0,
      status: "idle"
    };

    await magRef.update({
      translationStatus: {
        ...currentStatus,
        ...statusUpdate,
      },
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Firestore Admin] Error in adminUpdateMagazineTranslationStatus for mag ${magazineId}:`, error);
    throw error;
  }
}
