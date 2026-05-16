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
