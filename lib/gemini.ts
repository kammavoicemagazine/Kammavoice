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
          description: "True if the article relates to the Kamma community, its leaders, AP/TS development, agriculture, education, cinema personalities, NRIs, achievements, or events.",
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
          description: "3 to 5 relevant tags for the article (e.g., Politics, Business, Agriculture, Education).",
        },
        importanceScore: {
          type: SchemaType.INTEGER,
          description: "A score from 1 to 10 indicating the importance of the news to the community. 8-10 is for major breaking news.",
        },
        category: {
          type: SchemaType.STRING,
          description: "Determine the main category of the article. Must be exactly one of: 'politics', 'business', 'agriculture', 'education', 'kamma-community', 'ap-development'.",
        },
      },
      required: ["isRelevant", "isSafe", "summary", "summaryTelugu", "tags", "importanceScore", "category"],
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
  category: string;
}

/** Categorize article using keyword matching */
export function getKeywordCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  if (text.includes("amaravati") || text.includes("infrastructure") || text.includes("polavaram") || text.includes("development") || text.includes("metro") || text.includes("port") || text.includes("highway") || text.includes("road")) {
    return "ap-development";
  }
  if (text.includes("kamma") || text.includes("tana") || text.includes("nats") || text.includes("community") || text.includes("chowdary") || text.includes("nandamuri") || text.includes("balakrishna") || text.includes("akkineni") || text.includes("daggubati") || text.includes("ntr")) {
    return "kamma-community";
  }
  if (text.includes("politics") || text.includes("election") || text.includes("tdp") || text.includes("naidu") || text.includes("jagan") || text.includes("ysrcp") || text.includes("janasena") || text.includes("pawan") || text.includes("mla") || text.includes("mp") || text.includes("minister") || text.includes("assembly") || text.includes("government")) {
    return "politics";
  }
  if (text.includes("agriculture") || text.includes("farmer") || text.includes("crop") || text.includes("farming") || text.includes("rythu") || text.includes("irrigation") || text.includes("harvest")) {
    return "agriculture";
  }
  if (text.includes("education") || text.includes("school") || text.includes("college") || text.includes("student") || text.includes("exam") || text.includes("university") || text.includes("study") || text.includes("admission")) {
    return "education";
  }
  if (text.includes("business") || text.includes("startup") || text.includes("industry") || text.includes("investment") || text.includes("market") || text.includes("company") || text.includes("ceo") || text.includes("trade") || text.includes("economy")) {
    return "business";
  }
  
  return "politics"; // Default fallback category
}

/** Normalize category slug string to one of the six valid values */
export function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase().trim();
  if (c.includes("politics")) return "politics";
  if (c.includes("business")) return "business";
  if (c.includes("agriculture") || c.includes("farming") || c.includes("farmer")) return "agriculture";
  if (c.includes("education") || c.includes("school") || c.includes("college")) return "education";
  if (c.includes("kamma") || c.includes("community")) return "kamma-community";
  if (c.includes("development") || c.includes("ap-development") || c.includes("infrastructure") || c.includes("amaravati")) return "ap-development";
  return "politics";
}

/** Fallback processor for articles when Gemini AI is not available or fails */
export function fallbackProcessArticle(title: string, contentSnippet: string): AIProcessingResult {
  const category = getKeywordCategory(title, contentSnippet);
  const text = `${title} ${contentSnippet}`.toLowerCase();
  
  // Basic relevance check
  const relevantKeywords = [
    "kamma", "chowdary", "naidu", "tdp", "ysrcp", "janasena", "chandrababu", "lokesh", "jagan", "pawan", 
    "andhra", "ap ", "telangana", "amaravati", "hyderabad", "tana", "nats", "farmer", "agriculture",
    "education", "student", "business", "startup", "industry", "development", "infrastructure"
  ];
  const isRelevant = relevantKeywords.some(kw => text.includes(kw));
  const isSafe = !text.includes("hate speech") && !text.includes("violence") && !text.includes("terrorist");
  
  let summary = contentSnippet.trim();
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + "...";
  }
  
  const summaryTelugu = `తాజా వార్తా సమాచారం: ${title}`;
  const tags = [category];
  if (text.includes("ap") || text.includes("andhra")) tags.push("Andhra Pradesh");
  if (text.includes("development")) tags.push("Development");
  
  return {
    isRelevant,
    isSafe,
    summary,
    summaryTelugu,
    tags,
    importanceScore: 5,
    category
  };
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
    Your job is to analyze news articles and determine if they are relevant to the Kamma community or AP development.
    
    Relevance Criteria:
    - Political leaders (e.g., N. Chandrababu Naidu, N.T. Rama Rao, Devineni, Kodali Nani, Nara Lokesh, and general AP/TS politics involving the community).
    - Entrepreneurs, Business leaders, and industrialists from the community.
    - Agriculture and farming developments relevant to Andhra Pradesh.
    - Education, philanthropy, and achievements.
    - Cinema personalities (e.g., Nandamuri family, Daggubati, Akkineni, NTR Jr., etc.).
    - Kamma NRI community events and news (TANA, NATS, etc.).
    - Andhra Pradesh state development, infrastructure projects (Amaravati, Polavaram, etc.).
    
    Moderation & Safety:
    - Ensure the content is not overly toxic, fake, or highly inflammatory hate-speech. 
    
    Article Title: "${title}"
    Source: "${sourceName}"
    Content Snippet: "${contentSnippet}"
    
    Analyze the article and return the required JSON. Determine the most appropriate category slug from:
    - 'politics'
    - 'business'
    - 'agriculture'
    - 'education'
    - 'kamma-community'
    - 'ap-development'
    
    Ensure the summary is engaging and plagiarism-free.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const parsed = JSON.parse(response) as AIProcessingResult;
    
    if (parsed && parsed.category) {
      parsed.category = normalizeCategory(parsed.category);
    }
    
    return parsed;
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

interface OcrResponse {
  originalText?: string;
  confidenceScore?: number;
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

  let lastError: unknown = null;
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

      let parsed: OcrResponse | null = null;
      try {
        parsed = JSON.parse(responseText) as OcrResponse;
      } catch {
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned) as OcrResponse;
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
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini AI OCR] Attempt ${attempt} failed for Page ${pageNumber}: ${errMsg}`);
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  console.error(`Gemini OCR Error (Page ${pageNumber}) after ${retries + 1} attempts:`, lastError);
  return { error: lastError instanceof Error ? lastError.message : String(lastError) || "AI OCR processing returned null or timed out" };
}

export interface SingleTranslationResult {
  translation?: string;
  executionTimeMs?: number;
  estimatedTokens?: number;
  error?: string;
}

interface TranslationResponse {
  translation?: string;
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

  let lastError: unknown = null;

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

      let parsed: TranslationResponse | null = null;
      try {
        parsed = JSON.parse(responseText) as TranslationResponse;
      } catch {
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned) as TranslationResponse;
      }

      if (typeof parsed?.translation !== "string") {
        throw new Error("Malformed AI JSON response structure");
      }

      return {
        translation: parsed.translation.trim(),
        executionTimeMs,
        estimatedTokens: totalEstimatedTokens,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini AI Translate ${targetLang}] Attempt ${attempt} failed for Page ${pageNumber}: ${errMsg}`);
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  console.error(`Gemini Translation Error (${targetLang}, Page ${pageNumber}) after ${retries + 1} attempts:`, lastError);
  return { error: lastError instanceof Error ? lastError.message : String(lastError) || "AI translation processing returned null or timed out" };
}
