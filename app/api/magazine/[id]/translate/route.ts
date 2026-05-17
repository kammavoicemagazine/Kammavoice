import { NextResponse } from "next/server";
import { processMagazinePageMultimodal } from "@/lib/gemini";
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
    const { base64Image, pageNumber, totalPages } = body;

    if (!base64Image || !pageNumber) {
      return NextResponse.json({ error: "Missing base64Image or pageNumber" }, { status: 400 });
    }

    // Clean base64 prefix if present (e.g. data:image/jpeg;base64,...)
    const base64Data = base64Image.includes("base64,") 
      ? base64Image.split("base64,")[1] 
      : base64Image;

    // 1. Check if already completed to prevent redundant AI billing
    const existing = await getMagazinePageTranslation(magazineId, pageNumber);
    if (existing?.status === "completed" && existing.translations?.en) {
      console.log(`[API] Page ${pageNumber} already translated. Skipping Gemini processing.`);
      return NextResponse.json({
        success: true,
        pageNumber,
        confidenceScore: existing.confidenceScore || 95,
        cached: true,
      });
    }

    // 2. Mark as processing in Firestore
    await saveMagazinePageTranslation(magazineId, pageNumber, {
      status: "processing",
    });

    // 2. Call Gemini Multimodal AI
    const aiResult = await processMagazinePageMultimodal(base64Data, pageNumber);

    if (!aiResult) {
      // Mark failed
      await saveMagazinePageTranslation(magazineId, pageNumber, {
        status: "failed",
        errorMessage: "AI processing returned null or timed out.",
      });
      return NextResponse.json({ error: "AI translation failed" }, { status: 500 });
    }

    // 3. Save completed translation
    await saveMagazinePageTranslation(magazineId, pageNumber, {
      status: "completed",
      originalText: aiResult.originalText,
      translations: aiResult.translations,
      confidenceScore: aiResult.confidenceScore,
      executionTimeMs: aiResult.executionTimeMs,
      estimatedTokens: aiResult.estimatedTokens,
    });

    // 4. Update parent magazine translation status metadata
    if (totalPages) {
      await updateMagazineTranslationStatus(magazineId, {
        lastTranslatedPage: pageNumber,
        totalTranslatedPages: pageNumber, // In incremental flow, this tracks progress
        status: pageNumber === totalPages ? "completed" : "processing",
      });
    }

    return NextResponse.json({
      success: true,
      pageNumber,
      confidenceScore: aiResult.confidenceScore,
    });

  } catch (error: any) {
    console.error("POST /api/magazine/[id]/translate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
