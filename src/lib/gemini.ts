import { type Category } from "./db";
import { buildTaskParsePrompt } from "./api/gemini-prompts";
import { RateLimitError, redactSecret } from "./errors";

export interface ParsedTask {
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:MM or null
  category: Category;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const VALID_CATEGORIES: Category[] = ["job", "university", "life"];

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && VALID_CATEGORIES.includes(value as Category);
}

export function extractJsonObjectText(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function parseTaskPayload(value: string): ParsedTask {
  const jsonText = extractJsonObjectText(value);
  const parsed = JSON.parse(jsonText) as Partial<ParsedTask>;

  if (
    typeof parsed.title !== "string" ||
    !parsed.title.trim() ||
    typeof parsed.dueDate !== "string" ||
    !DATE_PATTERN.test(parsed.dueDate) ||
    (parsed.dueTime !== null && (typeof parsed.dueTime !== "string" || !TIME_PATTERN.test(parsed.dueTime))) ||
    !isCategory(parsed.category)
  ) {
    throw new Error("Invalid task structure from Gemini API");
  }

  return {
    title: parsed.title.trim().slice(0, 120),
    dueDate: parsed.dueDate,
    dueTime: parsed.dueTime,
    category: parsed.category,
  };
}

async function requestGemini(apiKey: string, prompt: string): Promise<string> {
  const payloads = [
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    },
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    },
    { contents: [{ parts: [{ text: prompt }] }] },
  ] as const;

  let last400Error = "";

  for (const model of GEMINI_MODELS) {
    for (const body of payloads) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.status === 429) {
        throw new RateLimitError();
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        if (response.status === 400) {
          last400Error = redactSecret(errorBody);
          continue;
        }
        throw new Error(`Gemini API error ${response.status}: ${redactSecret(errorBody)}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content?.trim()) return content;
    }
  }

  if (last400Error) {
    throw new Error(`Gemini API error 400: ${last400Error}`);
  }
  throw new Error("Empty response from Gemini API");
}

export async function parseTaskFromText(
  text: string,
  todayDate: string
): Promise<ParsedTask> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not configured");
  const normalizedText = text.trim().replace(/\s+/g, " ").slice(0, 500);
  if (!normalizedText) throw new Error("Voice input is empty");

  const prompt = buildTaskParsePrompt(normalizedText, todayDate);
  const content = await requestGemini(apiKey, prompt);
  return parseTaskPayload(content);
}
