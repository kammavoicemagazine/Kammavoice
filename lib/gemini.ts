import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        isRelevant: {
          type: SchemaType.BOOLEAN,
          description: "True if the article relates to the Kamma community, its leaders, entrepreneurs, agriculture, education, cinema personalities, NRIs, achievements, or events.",
        },
        isSafe: {
          type: SchemaType.BOOLEAN,
          description: "False if the article contains highly inflammatory, hateful, low-quality, or overtly toxic content. True otherwise.",
        },
        summary: {
          type: SchemaType.STRING,
          description: "A concise, plagiarism-free 2-3 sentence summary of the article in English. Must not be a direct copy of the original text.",
        },
        summaryTelugu: {
          type: SchemaType.STRING,
          description: "A natural Telugu translation of the summary.",
        },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "3 to 5 relevant tags/categories for the article (e.g., Politics, Business, NRI, Agriculture).",
        },
        importanceScore: {
          type: SchemaType.INTEGER,
          description: "A score from 1 to 10 indicating the importance of the news to the Kamma community. 8-10 is for major breaking news.",
        },
      },
      required: ["isRelevant", "isSafe", "summary", "summaryTelugu", "tags", "importanceScore"],
    },
  },
});

const ocrModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        originalText: {
          type: SchemaType.STRING,
          description: "The exact Telugu text extracted from the page image (OCR). Preserve paragraph breaks. If the page is purely an image/ad with no readable text, return empty string.",
        },
        confidenceScore: {
          type: SchemaType.INTEGER,
          description: "Estimated OCR confidence score from 0 to 100 based on text legibility.",
        },
      },
      required: ["originalText", "confidenceScore"],
    },
  },
});

const singleTranslationModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        translation: {
          type: SchemaType.STRING,
          description: "High-quality, natural translation preserving names, community terms, and context.",
        },
      },
      required: ["translation"],
    },
  },
});

export interface AIProcessingResult {
  isRelevant: boolean;
  isSafe: boolean;
  summary: string;
  summaryTelugu: string;
  tags: string[];
  importanceScore: number;
}

export async function processArticleWithAI(
  title: string,
  contentSnippet: string,
  sourceName: string
): Promise<AIProcessingResult | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found. Skipping AI processing.");
    return null;
  }

  const prompt = `
    You are an expert editorial AI for "Kamma Voice", a premier digital platform for the Kamma community (a prominent community in India).
    Your job is to analyze news articles and determine if they are relevant to the Kamma community.
    
    Relevance Criteria:
    - Political leaders (e.g., N. Chandrababu Naidu, N.T. Rama Rao, Devineni, Kodali Nani, etc. and general AP/TS politics involving the community).
    - Entrepreneurs, Business leaders, and industrialists from the community.
    - Agriculture and farming developments relevant to the community.
    - Education, philanthropy, and achievements.
    - Cinema personalities (e.g., Nandamuri family, Daggubati, Akkineni, NTR Jr., etc.).
    - Kamma NRI community events and news (TANA, NATS, etc.).
    
    Moderation & Safety:
    - Ensure the content is not overly toxic, fake, or highly inflammatory hate-speech. 
    - Constructive political news is fine.
    
    Article Title: "${title}"
    Source: "${sourceName}"
    Content Snippet: "${contentSnippet}"
    
    Analyze the article and return the required JSON. Ensure the summary is engaging and plagiarism-free.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response) as AIProcessingResult;
  } catch (error) {
    console.error("Gemini AI Processing Error:", error);
    return null;
  }
}

export interface OcrProcessingResult {
  originalText?: string;
  confidenceScore?: number;
  executionTimeMs?: number;
  estimatedTokens?: number;
  error?: string;
}

export async function processMagazinePageOcr(
  base64Image: string,
  pageNumber: number,
  mimeType = "image/jpeg",
  retries = 2
): Promise<OcrProcessingResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "GEMINI_API_KEY environment variable is missing on Vercel." };
  }

  const prompt = `
    You are an expert multilingual OCR AI for "Kamma Voice", a premium Telugu digital publishing platform serving the Kamma community globally.
    
    Task:
    Perform highly accurate OCR on the provided magazine page image (Page #${pageNumber}). Extract all Telugu text sequentially, preserving paragraph breaks, headers, and editorial formatting.
    If the page is purely a visual graphic, cover page, or advertisement with no meaningful editorial text, set originalText to "".
    
    Ensure all paragraph breaks (\n\n) match the original layout flow.
    Analyze the image and return the required JSON structure.
  `;

  let lastError: any = null;
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(new Error("Vercel Runtime Timeout Error: Task timed out")), 25000);

    try {
      console.log(`[Gemini AI OCR] Attempt ${attempt} for Page ${pageNumber}...`);
      const startTime = performance.now();
      const result = await ocrModel.generateContent([prompt, imagePart], { signal: abortController.signal });
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      const responseText = result.response.text();
      const estimatedPromptTokens = Math.round((prompt.length + (base64Image.length * 0.75)) / 4);
      const estimatedCompletionTokens = Math.round(responseText.length / 4);
      const totalEstimatedTokens = estimatedPromptTokens + estimatedCompletionTokens;

      console.log(`[Gemini AI OCR] Page ${pageNumber} Processed in ${executionTimeMs}ms | Est. Tokens: ~${totalEstimatedTokens}`);

      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (typeof parsed?.originalText !== "string") {
        throw new Error("Malformed AI JSON response structure");
      }

      return {
        originalText: parsed.originalText.trim(),
        confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 95,
        executionTimeMs,
        estimatedTokens: totalEstimatedTokens,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      console.warn(`[Gemini AI OCR] Attempt ${attempt} failed for Page ${pageNumber}:`, error.message || error);
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  console.error(`Gemini OCR Error (Page ${pageNumber}) after ${retries + 1} attempts:`, lastError);
  return { error: lastError?.message || lastError || "AI OCR processing returned null or timed out" };
}

export interface SingleTranslationResult {
  translation?: string;
  executionTimeMs?: number;
  estimatedTokens?: number;
  error?: string;
}

export async function processMagazinePageSingleTranslation(
  originalText: string,
  targetLang: "en" | "kn" | "ta",
  pageNumber: number,
  retries = 2
): Promise<SingleTranslationResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "GEMINI_API_KEY environment variable is missing on Vercel." };
  }

  if (!originalText.trim()) {
    return { translation: "", executionTimeMs: 0, estimatedTokens: 0 };
  }

  const langNames = { en: "English", kn: "Kannada", ta: "Tamil" };
  const targetLangName = langNames[targetLang];

  const prompt = `
    You are an expert Editorial AI for "Kamma Voice", a premium Telugu digital publishing platform serving the Kamma community globally.
    
    Task:
    Translate the following extracted Telugu magazine text (from Page #${pageNumber}) into high-quality, natural ${targetLangName}.
    
    CRITICAL GLOSSARY & TRANSLATION RULES:
    - DO NOT translate proper nouns, family names, or political figures literally (e.g., maintain names like N. Chandrababu Naidu, NTR, Nandamuri, Akkineni, Daggubati, Kodali Nani, Devineni exactly).
    - DO NOT translate community organization acronyms or names literally (e.g., TANA - Telugu Association of North America, NATS - North America Telugu Society, KIT - Kamma Icon Trust).
    - Preserve cultural and community-specific terms with appropriate contextual framing rather than awkward literal dictionary lookups.
    - Avoid robotic, word-for-word AI phrasing. Maintain an elegant, journalistic, and cinematic tone suitable for a premium digital magazine.
    - Ensure all paragraph breaks (\n\n) match the original layout flow.
    
    Telugu Original Text:
    """
    ${originalText}
    """
    
    Return the JSON object containing the translation.
  `;

  let lastError: any = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(new Error("Vercel Runtime Timeout Error: Task timed out")), 25000);

    try {
      console.log(`[Gemini AI Translate ${targetLang}] Attempt ${attempt} for Page ${pageNumber}...`);
      const startTime = performance.now();
      const result = await singleTranslationModel.generateContent(prompt, { signal: abortController.signal });
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      const responseText = result.response.text();
      const estimatedPromptTokens = Math.round(prompt.length / 4);
      const estimatedCompletionTokens = Math.round(responseText.length / 4);
      const totalEstimatedTokens = estimatedPromptTokens + estimatedCompletionTokens;

      console.log(`[Gemini AI Translate ${targetLang}] Page ${pageNumber} Processed in ${executionTimeMs}ms | Est. Tokens: ~${totalEstimatedTokens}`);

      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (typeof parsed?.translation !== "string") {
        throw new Error("Malformed AI JSON response structure");
      }

      return {
        translation: parsed.translation.trim(),
        executionTimeMs,
        estimatedTokens: totalEstimatedTokens,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      console.warn(`[Gemini AI Translate ${targetLang}] Attempt ${attempt} failed for Page ${pageNumber}:`, error.message || error);
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  console.error(`Gemini Translation Error (${targetLang}, Page ${pageNumber}) after ${retries + 1} attempts:`, lastError);
  return { error: lastError?.message || lastError || "AI translation processing returned null or timed out" };
}
