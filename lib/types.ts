/** Core article/news type */
export interface Article {
  id: string;
  title: string;
  titleTelugu?: string;
  slug: string;
  excerpt: string;
  excerptTelugu?: string;
  content: string;
  contentTelugu?: string;
  category: string;
  categoryTelugu?: string;
  author: Author;
  imageUrl: string;
  imagePublicId?: string;
  tags: string[];
  isFeatured: boolean;
  isBreaking: boolean;
  isPublished: boolean;
  viewCount: number;
  readingTime: number;
  magazineId?: string; // Optional link to a specific magazine issue
  createdAt: string;
  updatedAt: string;
  
  // Aggregation Fields
  isAggregated?: boolean;
  sourceUrl?: string;
  sourceName?: string;
  originalId?: string; // Hash of URL to prevent duplicates
  approvalStatus?: "pending" | "approved" | "rejected" | "auto-published";
  importanceScore?: number; // 1-10 AI assigned score
  trustScore?: number; // 1-10 source trust score
}

/** Author information */
export interface Author {
  name: string;
  avatar?: string;
  role?: string;
}

/** News category */
export interface Category {
  id: string;
  name: string;
  nameTelugu: string;
  slug: string;
  description?: string;
  articleCount: number;
  color?: string;
  icon?: string;
}

/** Gallery image */
export interface GalleryImage {
  id: string;
  url: string;
  publicId?: string;
  title: string;
  titleTelugu?: string;
  description?: string;
  category?: string;
  width: number;
  height: number;
  createdAt: string;
}

/** Video/reel */
export interface Video {
  id: string;
  title: string;
  titleTelugu?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category?: string;
  viewCount: number;
  createdAt: string;
}

export type AdCategory = "homepage_banner" | "magazine_banner" | "article_banner" | "half_page" | "full_page";
export type AdStatus = "active" | "scheduled" | "expired";

/** Advertisement */
export interface Advertisement {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  imageUrl: string;
  linkUrl: string;
  website?: string;
  category: AdCategory;
  status: AdStatus;
  sponsorName?: string;
  contactNumber?: string;
  notes?: string;
  isActive: boolean;
  featured?: boolean;
  amountPaid?: number;
  paymentStatus?: "pending" | "partial" | "paid";
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Admin analytics */
export interface AnalyticsData {
  totalArticles: number;
  totalViews: number;
  totalMedia: number;
  activeAds: number;
  recentArticles: Article[];
  viewsTrend: { date: string; views: number }[];
}

/** Digital Magazine Issue */
export interface Magazine {
  id: string;
  title: string;
  titleTelugu?: string;
  slug: string;
  issueDate: string; // e.g., "May 2026"
  volume: string; // e.g., "Vol. 1, Issue 5"
  coverImageUrl: string;
  coverImagePublicId?: string;
  pdfUrl: string;
  pdfPublicId?: string; // Cloudinary public ID for the raw PDF
  pageCount: number;
  category: string; // e.g., "Anniversary Edition", "Monthly"
  year: number;     // e.g., 2026
  tags: string[];   // e.g., ["Politics", "Cinema", "Business"]
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Translation Fields
  translationStatus?: {
    totalTranslatedPages: number;
    lastTranslatedPage: number;
    status: "idle" | "processing" | "completed" | "error";
    averageResponseTimeMs?: number;
    totalEstimatedTokens?: number;
    failedPageCount?: number;
    lastLogMessage?: string;
  };
}

/** Magazine Page Translation Subcollection Document */
export interface MagazinePageTranslation {
  id?: string;
  pageNumber: number; // 1-indexed
  status: "pending" | "processing" | "ocr_completed" | "translating_en" | "translating_kn" | "translating_ta" | "completed" | "failed";
  originalText: string; // Extracted Telugu OCR
  translations: {
    en?: string; // English
    kn?: string; // Kannada
    ta?: string; // Tamil
  };
  confidenceScore?: number; // 0-100 OCR confidence
  errorMessage?: string;
  executionTimeMs?: number;
  estimatedTokens?: number;
  updatedAt: string;
}
