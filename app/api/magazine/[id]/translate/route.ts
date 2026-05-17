import { NextResponse } from "next/server";
import { processMagazinePageOcr, processMagazinePageSingleTranslation } from "@/lib/gemini";
import { saveMagazinePageTranslation, updateMagazineTranslationStatus, getMagazinePageTranslation } from "@/lib/firestore";

// Enforce maximum Vercel serverless execution time for AI multimodal processing
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const magazineId = id;
    const body = await request.json();
    const { base64Image, pageNumber, totalPages, stage } = body;

    if (!pageNumber || !stage) {
      return NextResponse.json({ error: "Missing pageNumber or stage" }, { status: 400 });
    }

    const existing = await getMagazinePageTranslation(magazineId, pageNumber);

    // ─── STAGE 1: OCR ONLY ──────────────────────────────────────────────────
    if (stage === "ocr") {
      if (existing?.status && existing.status !== "pending" && existing.status !== "processing" && existing.status !== "failed" && existing.originalText !== undefined) {
        console.log(`[API] Page ${pageNumber} OCR already completed. Skipping.`);
        return NextResponse.json({ success: true, pageNumber, stage: "ocr", cached: true });
      }

      if (!base64Image) {
        return NextResponse.json({ error: "Missing base64Image for OCR stage" }, { status: 400 });
      }

      const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image;

      await saveMagazinePageTranslation(magazineId, pageNumber, { status: "processing" });

      const ocrResult = await processMagazinePageOcr(base64Data, pageNumber);

      if (ocrResult.error) {
        await saveMagazinePageTranslation(magazineId, pageNumber, { status: "failed", errorMessage: ocrResult.error });
        return NextResponse.json({ error: ocrResult.error }, { status: 500 });
      }

      await saveMagazinePageTranslation(magazineId, pageNumber, {
        status: "ocr_completed",
        originalText: ocrResult.originalText || "",
        confidenceScore: ocrResult.confidenceScore || 95,
        executionTimeMs: ocrResult.executionTimeMs,
        estimatedTokens: ocrResult.estimatedTokens,
      });

      if (totalPages) {
        await updateMagazineTranslationStatus(magazineId, {
          lastTranslatedPage: pageNumber,
          status: "processing",
        });
      }

      return NextResponse.json({ success: true, pageNumber, stage: "ocr" });
    }

    // ─── STAGE 2: TRANSLATE ENGLISH ──────────────────────────────────────────
    if (stage === "translate_en") {
      if (existing?.translations?.en) {
        console.log(`[API] Page ${pageNumber} English translation already exists. Skipping.`);
        return NextResponse.json({ success: true, pageNumber, stage: "translate_en", cached: true });
      }

      const originalText = existing?.originalText || "";
      await saveMagazinePageTranslation(magazineId, pageNumber, { status: "translating_en" });

      const transResult = await processMagazinePageSingleTranslation(originalText, "en", pageNumber);

      if (transResult.error) {
        await saveMagazinePageTranslation(magazineId, pageNumber, { status: "failed", errorMessage: transResult.error });
        return NextResponse.json({ error: transResult.error }, { status: 500 });
      }

      const currentTranslations = existing?.translations || {};
      await saveMagazinePageTranslation(magazineId, pageNumber, {
        status: "translating_kn",
        translations: { ...currentTranslations, en: transResult.translation || "" },
        executionTimeMs: (existing?.executionTimeMs || 0) + (transResult.executionTimeMs || 0),
        estimatedTokens: (existing?.estimatedTokens || 0) + (transResult.estimatedTokens || 0),
      });

      return NextResponse.json({ success: true, pageNumber, stage: "translate_en" });
    }

    // ─── STAGE 3: TRANSLATE KANNADA ──────────────────────────────────────────
    if (stage === "translate_kn") {
      if (existing?.translations?.kn) {
        console.log(`[API] Page ${pageNumber} Kannada translation already exists. Skipping.`);
        return NextResponse.json({ success: true, pageNumber, stage: "translate_kn", cached: true });
      }

      const originalText = existing?.originalText || "";
      await saveMagazinePageTranslation(magazineId, pageNumber, { status: "translating_kn" });

      const transResult = await processMagazinePageSingleTranslation(originalText, "kn", pageNumber);

      if (transResult.error) {
        await saveMagazinePageTranslation(magazineId, pageNumber, { status: "failed", errorMessage: transResult.error });
        return NextResponse.json({ error: transResult.error }, { status: 500 });
      }

      const currentTranslations = existing?.translations || {};
      await saveMagazinePageTranslation(magazineId, pageNumber, {
        status: "translating_ta",
        translations: { ...currentTranslations, kn: transResult.translation || "" },
        executionTimeMs: (existing?.executionTimeMs || 0) + (transResult.executionTimeMs || 0),
        estimatedTokens: (existing?.estimatedTokens || 0) + (transResult.estimatedTokens || 0),
      });

      return NextResponse.json({ success: true, pageNumber, stage: "translate_kn" });
    }

    // ─── STAGE 4: TRANSLATE TAMIL ────────────────────────────────────────────
    if (stage === "translate_ta") {
      if (existing?.translations?.ta) {
        console.log(`[API] Page ${pageNumber} Tamil translation already exists. Skipping.`);
        return NextResponse.json({ success: true, pageNumber, stage: "translate_ta", cached: true });
      }

      const originalText = existing?.originalText || "";
      await saveMagazinePageTranslation(magazineId, pageNumber, { status: "translating_ta" });

      const transResult = await processMagazinePageSingleTranslation(originalText, "ta", pageNumber);

      if (transResult.error) {
        await saveMagazinePageTranslation(magazineId, pageNumber, { status: "failed", errorMessage: transResult.error });
        return NextResponse.json({ error: transResult.error }, { status: 500 });
      }

      const currentTranslations = existing?.translations || {};
      await saveMagazinePageTranslation(magazineId, pageNumber, {
        status: "completed",
        translations: { ...currentTranslations, ta: transResult.translation || "" },
        executionTimeMs: (existing?.executionTimeMs || 0) + (transResult.executionTimeMs || 0),
        estimatedTokens: (existing?.estimatedTokens || 0) + (transResult.estimatedTokens || 0),
      });

      if (totalPages) {
        await updateMagazineTranslationStatus(magazineId, {
          lastTranslatedPage: pageNumber,
          totalTranslatedPages: pageNumber,
          status: pageNumber === totalPages ? "completed" : "processing",
        });
      }

      return NextResponse.json({ success: true, pageNumber, stage: "translate_ta" });
    }

    return NextResponse.json({ error: "Invalid stage specified" }, { status: 400 });

  } catch (error: any) {
    console.error("POST /api/magazine/[id]/translate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
