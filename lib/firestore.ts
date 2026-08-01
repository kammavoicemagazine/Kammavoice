import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  db
} from "./firebase";
import type { Article, Category, Advertisement, AdCategory, GalleryImage, Magazine, MagazinePageTranslation } from "./types";

console.log("[Firestore Module Scope] db is:", db);

/* ═══════════════════════════════════════════════════════════════
   ARTICLES
   ═══════════════════════════════════════════════════════════════ */

const articlesRef = collection(db, "articles");

/** Fetch all published articles (ordered by createdAt desc) */
export async function getArticles(maxCount = 50): Promise<Article[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("isPublished", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxCount),
    ];
    const q = query(articlesRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (err) {
    console.warn("[Firestore] getArticles failed (index building/missing). Falling back to client-side sorting:", err);
    try {
      const q = query(articlesRef, where("isPublished", "==", true));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore] getArticles fallback failed:", fallbackErr);
      return [];
    }
  }
}

/** Fetch all articles for admin (including drafts) */
export async function getAllArticles(): Promise<Article[]> {
  const q = query(articlesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
}

/** Fetch a single article by slug */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(
    articlesRef,
    where("slug", "==", slug),
    where("isPublished", "==", true),
    limit(1)
  );
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
  try {
    const constraints: QueryConstraint[] = [
      where("isPublished", "==", true),
      where("magazineId", "==", magazineId),
      orderBy("createdAt", "desc"),
    ];
    const q = query(articlesRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (err) {
    console.warn("[Firestore] getArticlesByMagazine failed. Falling back to client-side sorting:", err);
    try {
      const q = query(
        articlesRef,
        where("isPublished", "==", true),
        where("magazineId", "==", magazineId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list;
    } catch (fallbackErr) {
      console.error("[Firestore] getArticlesByMagazine fallback failed:", fallbackErr);
      return [];
    }
  }
}

/** Fetch articles by category */
export async function getArticlesByCategory(
  category: string,
  maxCount = 20
): Promise<Article[]> {
  try {
    const q = query(
      articlesRef,
      where("isPublished", "==", true),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (err) {
    console.warn("[Firestore] getArticlesByCategory failed. Falling back to client-side sorting:", err);
    try {
      const q = query(
        articlesRef,
        where("isPublished", "==", true),
        where("category", "==", category)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore] getArticlesByCategory fallback failed:", fallbackErr);
      return [];
    }
  }
}

/** Fetch featured articles */
export async function getFeaturedArticles(maxCount = 4): Promise<Article[]> {
  try {
    const q = query(
      articlesRef,
      where("isPublished", "==", true),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (err) {
    console.warn("[Firestore] getFeaturedArticles failed. Falling back to client-side sorting:", err);
    try {
      const q = query(
        articlesRef,
        where("isPublished", "==", true),
        where("isFeatured", "==", true)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore] getFeaturedArticles fallback failed:", fallbackErr);
      return [];
    }
  }
}

/** Fetch breaking news articles */
export async function getBreakingArticles(maxCount = 5): Promise<Article[]> {
  try {
    const q = query(
      articlesRef,
      where("isPublished", "==", true),
      where("isBreaking", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (err) {
    console.warn("[Firestore] getBreakingArticles failed. Falling back to client-side sorting:", err);
    try {
      const q = query(
        articlesRef,
        where("isPublished", "==", true),
        where("isBreaking", "==", true)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore] getBreakingArticles fallback failed:", fallbackErr);
      return [];
    }
  }
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
    { name: "Business", nameTelugu: "వ్యాపారం", slug: "business", articleCount: 0, color: "#4AD98B" },
    { name: "Agriculture", nameTelugu: "వ్యవసాయం", slug: "agriculture", articleCount: 0, color: "#E67E22" },
    { name: "Education", nameTelugu: "విద్య", slug: "education", articleCount: 0, color: "#9B59B6" },
    { name: "Kamma Community", nameTelugu: "కమ్మ సమాజం", slug: "kamma-community", articleCount: 0, color: "#4A90D9" },
    { name: "Andhra Pradesh Development", nameTelugu: "ఆంధ్రప్రదేశ్ అభివృద్ధి", slug: "ap-development", articleCount: 0, color: "#D94A6B" },
  ];

  for (const cat of defaults) {
    await addDoc(categoriesRef, cat);
  }
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
  try {
    const q = query(
      magazinesRef,
      where("isPublished", "==", true),
      orderBy("createdAt", "desc"),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Magazine));
  } catch (err) {
    console.warn("[Firestore] getMagazines failed (index building/missing). Falling back to client-side sorting:", err);
    try {
      const q = query(magazinesRef, where("isPublished", "==", true));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Magazine));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list.slice(0, maxCount);
    } catch (fallbackErr) {
      console.error("[Firestore] getMagazines fallback failed:", fallbackErr);
      return [];
    }
  }
}

export async function getAllMagazines(): Promise<Magazine[]> {
  const q = query(magazinesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Magazine));
}

export async function getMagazineBySlug(slug: string): Promise<Magazine | null> {
  const q = query(
    magazinesRef,
    where("slug", "==", slug),
    where("isPublished", "==", true),
    limit(1)
  );
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
      tags: f.tags?.arrayValue?.values?.map((v: unknown) => (v as { stringValue?: string })?.stringValue).filter(Boolean) as string[] || [],
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

/** 
 * SSR-safe fetcher for magazines by slug using the REST API.
 */
export async function getMagazineBySlugSSR(slug: string): Promise<Magazine | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  try {
    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "magazines" }],
          where: {
            fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } }
          },
          limit: 1
        }
      }),
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data[0]?.document) return null;
    
    const doc = data[0].document;
    const f = doc.fields;
    const id = doc.name.split('/').pop() || "";
    
    return {
      id: id,
      title: f.title?.stringValue || "",
      titleTelugu: f.titleTelugu?.stringValue,
      slug: f.slug?.stringValue || "",
      issueDate: f.issueDate?.stringValue || "",
      volume: f.volume?.stringValue || "",
      category: f.category?.stringValue || "Monthly",
      year: parseInt(f.year?.integerValue || "2026"),
      tags: f.tags?.arrayValue?.values?.map((v: unknown) => (v as { stringValue?: string })?.stringValue).filter(Boolean) as string[] || [],
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
    console.error("Magazine Slug REST Fetch Error:", error);
    return null;
  }
}

export async function getArticleBySlugSSR(slug: string): Promise<Article | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  try {
    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "articles" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } } },
                { fieldFilter: { field: { fieldPath: "isPublished" }, op: "EQUAL", value: { booleanValue: true } } }
              ]
            }
          },
          limit: 1
        }
      }),
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data[0]?.document) return null;
    
    const doc = data[0].document;
    const f = doc.fields;
    const id = doc.name.split('/').pop();
    
    // Construct Article object
    return {
      id,
      title: f.title?.stringValue || "",
      titleTelugu: f.titleTelugu?.stringValue,
      slug: f.slug?.stringValue || "",
      excerpt: f.excerpt?.stringValue || "",
      content: f.content?.stringValue || "",
      category: f.category?.stringValue || "News",
      categoryTelugu: f.categoryTelugu?.stringValue,
      imageUrl: f.imageUrl?.stringValue || "",
      imagePublicId: f.imagePublicId?.stringValue,
      tags: f.tags?.arrayValue?.values?.map((v: unknown) => (v as { stringValue?: string })?.stringValue).filter(Boolean) as string[] || [],
      author: {
        name: f.author?.mapValue?.fields?.name?.stringValue || "Admin",
        id: f.author?.mapValue?.fields?.id?.stringValue || "admin",
        role: f.author?.mapValue?.fields?.role?.stringValue || "Editor",
      },
      isPublished: f.isPublished?.booleanValue ?? true,
      isFeatured: f.isFeatured?.booleanValue ?? false,
      isBreaking: f.isBreaking?.booleanValue ?? false,
      viewCount: parseInt(f.viewCount?.integerValue || "0"),
      readingTime: parseInt(f.readingTime?.integerValue || "3"),
      isAggregated: f.isAggregated?.booleanValue ?? false,
      sourceUrl: f.sourceUrl?.stringValue,
      sourceName: f.sourceName?.stringValue,
      originalId: f.originalId?.stringValue,
      approvalStatus: f.approvalStatus?.stringValue,
      createdAt: f.createdAt?.stringValue || new Date().toISOString(),
      updatedAt: f.updatedAt?.stringValue || new Date().toISOString(),
    } as Article;
  } catch (error) {
    console.error("Article REST Fetch Error:", error);
    return null;
  }
}

export async function createMagazine(
  data: Omit<Magazine, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<string> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  try {
    const docRef = await addDoc(magazinesRef, {
      ...cleanData,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (clientErr) {
    console.warn("[createMagazine] Client SDK write failed, falling back to Server API endpoint:", clientErr);
    const res = await fetch("/api/admin/magazines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server API fallback failed with status ${res.status}`);
    }
    const result = await res.json();
    return result.id;
  }
}

export async function updateMagazine(
  id: string,
  data: Partial<Magazine>
): Promise<void> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  try {
    const docRef = doc(db, "magazines", id);
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: new Date().toISOString(),
    });
  } catch (clientErr) {
    console.warn("[updateMagazine] Client SDK update failed, falling back to Server API endpoint:", clientErr);
    const res = await fetch("/api/admin/magazines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data: cleanData }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server API fallback failed with status ${res.status}`);
    }
  }
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

export async function checkArticleExistsByOriginalId(originalId: string, sourceUrl?: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "articles"), 
      where("isAggregated", "==", true),
      where("originalId", "==", originalId), 
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return true;

    if (sourceUrl) {
      const q2 = query(
        collection(db, "articles"), 
        where("isAggregated", "==", true),
        where("sourceUrl", "==", sourceUrl), 
        limit(1)
      );
      const snapshot2 = await getDocs(q2);
      if (!snapshot2.empty) return true;
    }

    return false;
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
      isPublished: articleData.isPublished ?? (articleData.approvalStatus === "auto-published"),
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
    const updateData: Partial<Article> = {
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

/* ═══════════════════════════════════════════════════════════════
   MAGAZINE TRANSLATIONS
   ═══════════════════════════════════════════════════════════════ */

/** Save or update a magazine page translation document in the subcollection */
export async function saveMagazinePageTranslation(
  magazineId: string, 
  pageNumber: number, 
  data: Partial<MagazinePageTranslation>
): Promise<void> {
  try {
    const pageRef = doc(db, "magazines", magazineId, "pages", pageNumber.toString());
    const payload = {
      pageNumber,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    
    await setDoc(pageRef, payload, { merge: true });
  } catch (error) {
    console.error(`Error saving translation for mag ${magazineId} page ${pageNumber}:`, error);
    throw error;
  }
}

/** Fetch a single page translation */
export async function getMagazinePageTranslation(magazineId: string, pageNumber: number): Promise<MagazinePageTranslation | null> {
  try {
    const pageRef = doc(db, "magazines", magazineId, "pages", pageNumber.toString());
    const snap = await getDoc(pageRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as MagazinePageTranslation;
  } catch (error) {
    console.error(`Error fetching translation for mag ${magazineId} page ${pageNumber}:`, error);
    return null;
  }
}

/** Fetch all page translations for a magazine */
export async function getMagazineAllPageTranslations(magazineId: string): Promise<MagazinePageTranslation[]> {
  try {
    const pagesColl = collection(db, "magazines", magazineId, "pages");
    const q = query(pagesColl, orderBy("pageNumber", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MagazinePageTranslation));
  } catch (error) {
    console.error(`Error fetching all translations for mag ${magazineId}:`, error);
    return [];
  }
}

/** Update the magazine's parent translationStatus metadata */
export async function updateMagazineTranslationStatus(
  magazineId: string, 
  statusUpdate: Partial<Magazine['translationStatus']>
): Promise<void> {
  try {
    const magRef = doc(db, "magazines", magazineId);
    const snap = await getDoc(magRef);
    if (!snap.exists()) return;
    
    const currentStatus = snap.data().translationStatus || {
      totalTranslatedPages: 0,
      lastTranslatedPage: 0,
      status: "idle"
    };

    await updateDoc(magRef, {
      translationStatus: {
        ...currentStatus,
        ...statusUpdate,
      },
      updatedAt: new Date().toISOString()
    });
} catch (error) {
    console.error(`Error updating translation status for mag ${magazineId}:`, error);
    throw error;
  }
}

/* ═══════════════════════════════════════════════════════════════
   ADVERTISEMENT SYSTEM
   ═══════════════════════════════════════════════════════════════ */

export const adsRef = collection(db, "ads");

export async function adminGetAds(): Promise<Advertisement[]> {
  const q = query(adsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Advertisement));
}

export async function getActiveAdsByCategory(category: AdCategory): Promise<Advertisement[]> {
  const now = new Date().toISOString();
  console.log(`[Firestore Debug] getActiveAdsByCategory category: "${category}", now: "${now}"`);
  
  const q = query(
    adsRef,
    where("category", "==", category),
    where("status", "in", ["active", "scheduled"]),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  const ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Advertisement));
  
  console.log(`[Firestore Debug] getActiveAdsByCategory raw retrieved ads: ${ads.length}`);
  ads.forEach(ad => {
    console.log(`[Firestore Debug] Ad ID: ${ad.id}, Title: "${ad.title}", Status: "${ad.status}", isActive: ${ad.isActive}, startDate: "${ad.startDate}", endDate: "${ad.endDate}", startDate <= now: ${ad.startDate <= now}, endDate >= now: ${ad.endDate >= now}`);
  });

  const filtered = ads.filter(ad => ad.startDate <= now && ad.endDate >= now);
  console.log(`[Firestore Debug] getActiveAdsByCategory final active count: ${filtered.length}`);
  return filtered;
}
export async function getAllActiveAds(): Promise<Advertisement[]> {
  const now = new Date().toISOString();
  console.log(`[Firestore Debug] getAllActiveAds, now: "${now}"`);
  
  const q = query(
    adsRef,
    where("status", "in", ["active", "scheduled"]),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  const ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Advertisement));
  
  console.log(`[Firestore Debug] getAllActiveAds raw retrieved ads: ${ads.length}`);
  ads.forEach(ad => {
    console.log(`[Firestore Debug] Ad ID: ${ad.id}, Title: "${ad.title}", Status: "${ad.status}", isActive: ${ad.isActive}, startDate: "${ad.startDate}", endDate: "${ad.endDate}", startDate <= now: ${ad.startDate <= now}, endDate >= now: ${ad.endDate >= now}`);
  });

  const filtered = ads.filter(ad => ad.startDate <= now && ad.endDate >= now);
  console.log(`[Firestore Debug] getAllActiveAds final active count: ${filtered.length}`);
  return filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

export async function getAdBySlug(slug: string): Promise<Advertisement | null> {
  const q = query(adsRef, where("slug", "==", slug));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Advertisement;
  }
  
  // Fallback: try by ID if slug is not found
  try {
    const docRef = doc(db, "ads", slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Advertisement;
    }
  } catch (err) {
    // ignore
  }

  return null;
}
export async function createAd(data: Omit<Advertisement, "id" | "impressions" | "clicks" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(adsRef, {
    ...data,
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateAd(id: string, data: Partial<Advertisement>): Promise<void> {
  const docRef = doc(db, "ads", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAd(id: string): Promise<void> {
  const docRef = doc(db, "ads", id);
  await deleteDoc(docRef);
}

export async function incrementAdImpression(id: string): Promise<void> {
  const docRef = doc(db, "ads", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data().impressions || 0;
      await updateDoc(docRef, { impressions: current + 1 });
    }
  } catch (err) {
    console.warn("Failed to increment ad impression", err);
  }
}

export async function incrementAdClick(id: string): Promise<void> {
  const docRef = doc(db, "ads", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data().clicks || 0;
      await updateDoc(docRef, { clicks: current + 1 });
    }
  } catch (err) {
    console.warn("Failed to increment ad click", err);
  }
}
