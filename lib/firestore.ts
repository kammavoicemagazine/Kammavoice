import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article, Category, Advertisement, GalleryImage, Magazine } from "./types";

/* ═══════════════════════════════════════════════════════════════
   ARTICLES
   ═══════════════════════════════════════════════════════════════ */

const articlesRef = collection(db, "articles");

/** Fetch all published articles (ordered by createdAt desc) */
export async function getArticles(maxCount = 50): Promise<Article[]> {
  const constraints: QueryConstraint[] = [
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxCount),
  ];
  const q = query(articlesRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch all articles for admin (including drafts) */
export async function getAllArticles(): Promise<Article[]> {
  const q = query(articlesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch a single article by slug */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(articlesRef, where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Article;
}

/** Fetch a single article by ID */
export async function getArticleById(id: string): Promise<Article | null> {
  const docRef = doc(db, "articles", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Article;
}

/** Fetch articles by magazine ID */
export async function getArticlesByMagazine(magazineId: string): Promise<Article[]> {
  const constraints: QueryConstraint[] = [
    where("isPublished", "==", true),
    where("magazineId", "==", magazineId),
    orderBy("createdAt", "desc"),
  ];
  const q = query(articlesRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch articles by category */
export async function getArticlesByCategory(
  category: string,
  maxCount = 20
): Promise<Article[]> {
  const q = query(
    articlesRef,
    where("isPublished", "==", true),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch featured articles */
export async function getFeaturedArticles(maxCount = 4): Promise<Article[]> {
  const q = query(
    articlesRef,
    where("isPublished", "==", true),
    where("isFeatured", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch breaking news articles */
export async function getBreakingArticles(maxCount = 5): Promise<Article[]> {
  const q = query(
    articlesRef,
    where("isPublished", "==", true),
    where("isBreaking", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Create a new article */
export async function createArticle(
  data: Omit<Article, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<string> {
  const docRef = await addDoc(articlesRef, {
    ...data,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

/** Update an existing article */
export async function updateArticle(
  id: string,
  data: Partial<Article>
): Promise<void> {
  const docRef = doc(db, "articles", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/** Delete an article */
export async function deleteArticle(id: string): Promise<void> {
  const docRef = doc(db, "articles", id);
  await deleteDoc(docRef);
}

/** Increment article view count */
export async function incrementViewCount(id: string): Promise<void> {
  const docRef = doc(db, "articles", id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = (snap.data() as DocumentData).viewCount || 0;
    await updateDoc(docRef, { viewCount: current + 1 });
  }
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════════════════════ */

const categoriesRef = collection(db, "categories");

/** Fetch all categories */
export async function getCategories(): Promise<Category[]> {
  const q = query(categoriesRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

/** Create a category */
export async function createCategory(
  data: Omit<Category, "id">
): Promise<string> {
  const docRef = await addDoc(categoriesRef, data);
  return docRef.id;
}

/** Seed default categories (run once) */
export async function seedCategories(): Promise<void> {
  const existing = await getDocs(categoriesRef);
  if (!existing.empty) return; // already seeded

  const defaults: Omit<Category, "id">[] = [
    { name: "Politics", nameTelugu: "రాజకీయాలు", slug: "politics", articleCount: 0, color: "#C9A84C" },
    { name: "Community", nameTelugu: "సమాజం", slug: "community", articleCount: 0, color: "#4A90D9" },
    { name: "Culture", nameTelugu: "సంస్కృతి", slug: "culture", articleCount: 0, color: "#D94A6B" },
    { name: "Business", nameTelugu: "వ్యాపారం", slug: "business", articleCount: 0, color: "#4AD98B" },
    { name: "Education", nameTelugu: "విద్య", slug: "education", articleCount: 0, color: "#9B59B6" },
    { name: "Sports", nameTelugu: "క్రీడలు", slug: "sports", articleCount: 0, color: "#E67E22" },
  ];

  for (const cat of defaults) {
    await addDoc(categoriesRef, cat);
  }
}

/* ═══════════════════════════════════════════════════════════════
   ADVERTISEMENTS
   ═══════════════════════════════════════════════════════════════ */

const adsRef = collection(db, "advertisements");

export async function getActiveAds(
  placement?: string
): Promise<Advertisement[]> {
  const constraints: QueryConstraint[] = [
    where("isActive", "==", true),
  ];
  if (placement) {
    constraints.push(where("placement", "==", placement));
  }
  const q = query(adsRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Advertisement));
}

/* ═══════════════════════════════════════════════════════════════
   MEDIA
   ═══════════════════════════════════════════════════════════════ */

const mediaRef = collection(db, "media");

export async function saveMediaRecord(
  data: Omit<GalleryImage, "id">
): Promise<string> {
  const docRef = await addDoc(mediaRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getMediaRecords(
  maxCount = 50
): Promise<GalleryImage[]> {
  const q = query(mediaRef, orderBy("createdAt", "desc"), limit(maxCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryImage));
}

/* ═══════════════════════════════════════════════════════════════
   MAGAZINES
   ═══════════════════════════════════════════════════════════════ */

const magazinesRef = collection(db, "magazines");

export async function getMagazines(maxCount = 20): Promise<Magazine[]> {
  const q = query(
    magazinesRef,
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Magazine));
}

export async function getAllMagazines(): Promise<Magazine[]> {
  const q = query(magazinesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Magazine));
}

export async function getMagazineBySlug(slug: string): Promise<Magazine | null> {
  const q = query(magazinesRef, where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Magazine;
}

export async function getMagazineById(id: string): Promise<Magazine | null> {
  const docRef = doc(db, "magazines", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Magazine;
}

/** 
 * SSR-safe fetcher for magazines using the REST API.
 * This avoids gRPC connection issues in Next.js Server Components.
 */
export async function getMagazineByIdSSR(id: string): Promise<Magazine | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/magazines/${id}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data.fields) return null;
    
    const f = data.fields;
    return {
      id: id,
      title: f.title?.stringValue || "",
      titleTelugu: f.titleTelugu?.stringValue,
      slug: f.slug?.stringValue || "",
      issueDate: f.issueDate?.stringValue || "",
      volume: f.volume?.stringValue || "",
      category: f.category?.stringValue || "Monthly",
      year: parseInt(f.year?.integerValue || "2026"),
      tags: f.tags?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      coverImageUrl: f.coverImageUrl?.stringValue || "",
      coverImagePublicId: f.coverImagePublicId?.stringValue,
      pdfUrl: f.pdfUrl?.stringValue || "",
      pdfPublicId: f.pdfPublicId?.stringValue,
      pageCount: parseInt(f.pageCount?.integerValue || "0"),
      viewCount: parseInt(f.viewCount?.integerValue || "0"),
      isPublished: f.isPublished?.booleanValue ?? true,
      createdAt: f.createdAt?.stringValue || new Date().toISOString(),
      updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
    } as Magazine;
  } catch (error) {
    console.error("Magazine REST Fetch Error:", error);
    return null;
  }
}

export async function createMagazine(
  data: Omit<Magazine, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<string> {
  const docRef = await addDoc(magazinesRef, {
    ...data,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateMagazine(
  id: string,
  data: Partial<Magazine>
): Promise<void> {
  const docRef = doc(db, "magazines", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMagazine(id: string): Promise<void> {
  const docRef = doc(db, "magazines", id);
  await deleteDoc(docRef);
}

export async function incrementMagazineViewCount(id: string): Promise<void> {
  const docRef = doc(db, "magazines", id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = (snap.data() as DocumentData).viewCount || 0;
    await updateDoc(docRef, { viewCount: current + 1 });
  }
}

// ─── AGGREGATED NEWS (QUEUE & INGESTION) ─────────────────────────────

export async function checkArticleExistsByOriginalId(originalId: string): Promise<boolean> {
  try {
    const q = query(collection(db, "articles"), where("originalId", "==", originalId), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking article exists:", error);
    return false;
  }
}

export async function saveAggregatedArticle(articleData: Partial<Article>): Promise<string> {
  try {
    const articlesRef = collection(db, "articles");
    const docRef = await addDoc(articlesRef, {
      ...articleData,
      isAggregated: true,
      approvalStatus: articleData.approvalStatus || "pending",
      isPublished: articleData.approvalStatus === "auto-published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving aggregated article:", error);
    throw error;
  }
}

export async function getPendingAggregatedArticles(): Promise<Article[]> {
  try {
    const q = query(
      collection(db, "articles"),
      where("isAggregated", "==", true),
      where("approvalStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
  } catch (error) {
    console.error("Error fetching pending articles:", error);
    return [];
  }
}

export async function updateAggregatedArticleStatus(id: string, status: "approved" | "rejected", overrideData?: Partial<Article>): Promise<void> {
  try {
    const ref = doc(db, "articles", id);
    const updateData: any = {
      approvalStatus: status,
      isPublished: status === "approved",
      updatedAt: new Date().toISOString(),
      ...overrideData
    };
    await updateDoc(ref, updateData);
  } catch (error) {
    console.error("Error updating article status:", error);
    throw error;
  }
}
