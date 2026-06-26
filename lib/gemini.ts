/**
 * Centralized Gemini AI Module
 * ============================
 * Single source of truth for all AI-related API interactions in CementPro MES.
 * Handles model configuration, request building, response parsing, and error handling.
 *
 * Model: gemini-2.5-flash (Free Tier compatible)
 * API: Google Generative Language REST API v1
 */

// ─── Configuration ──────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_VERSION = "v1beta";
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}`;

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface GeminiSchemaProperty {
  type: "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  enum?: string[];
  items?: GeminiSchemaProperty;
  properties?: Record<string, GeminiSchemaProperty>;
  required?: string[];
}

export interface GeminiResponseSchema {
  type: "OBJECT";
  properties: Record<string, GeminiSchemaProperty>;
  required: string[];
}

export interface GeminiRequestOptions {
  /** The user-facing prompt text */
  prompt: string;
  /** Optional system instruction for context/persona */
  systemInstruction?: string;
  /** JSON response schema for structured output */
  responseSchema?: GeminiResponseSchema;
  /** Temperature (0.0 - 2.0). Lower = more deterministic. Default: 0.7 */
  temperature?: number;
  /** Max output tokens. Default: 2048 */
  maxOutputTokens?: number;
}

export interface GeminiResponse<T = Record<string, unknown>> {
  data: T;
  isMock: false;
}

export interface GeminiFallbackResponse<T = Record<string, unknown>> {
  data: T;
  isMock: true;
}

export class GeminiApiError extends Error {
  public status: number;
  public responseBody: string;

  constructor(status: number, responseBody: string) {
    super(`Gemini API responded with status ${status}`);
    this.name = "GeminiApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Returns the Gemini API key from environment variables.
 * Returns null if no key is configured (triggers fallback mode).
 */
export function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return key || null;
}

/**
 * Checks if the Gemini API is configured and available.
 */
export function isGeminiAvailable(): boolean {
  return getApiKey() !== null;
}

/**
 * Builds the full Gemini API endpoint URL for generateContent.
 */
function buildEndpointUrl(apiKey: string): string {
  return `${GEMINI_BASE_URL}:generateContent?key=${apiKey}`;
}

/**
 * Builds the request body for the Gemini generateContent API.
 */
function buildRequestBody(options: GeminiRequestOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
  };

  // Add system instruction if provided
  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  // Build generation config
  const generationConfig: Record<string, unknown> = {};

  if (options.temperature !== undefined) {
    generationConfig.temperature = options.temperature;
  }

  if (options.maxOutputTokens !== undefined) {
    generationConfig.maxOutputTokens = options.maxOutputTokens;
  }

  // Add structured output schema
  if (options.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = options.responseSchema;
  }

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  return body;
}

/**
 * Parses the Gemini API response and extracts the generated text.
 */
function extractResponseText(responseJson: Record<string, unknown>): string {
  const candidates = responseJson?.candidates as Array<Record<string, unknown>> | undefined;
  const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts?.[0]?.text as string | undefined;

  if (!text) {
    throw new GeminiApiError(
      200,
      "Invalid response format: no text found in candidates[0].content.parts[0].text"
    );
  }

  return text;
}

/**
 * Main function to call the Gemini AI API.
 * Returns parsed JSON data from the structured response.
 *
 * @throws {GeminiConfigError} if API key is not configured
 * @throws {GeminiApiError} if the API returns a non-OK response
 *
 * @example
 * ```ts
 * const result = await callGemini<{ summary: string }>({
 *   prompt: "Summarize this data...",
 *   responseSchema: {
 *     type: "OBJECT",
 *     properties: { summary: { type: "STRING" } },
 *     required: ["summary"]
 *   }
 * });
 * console.log(result.summary);
 * ```
 */
export async function callGemini<T = Record<string, unknown>>(
  options: GeminiRequestOptions
): Promise<T> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not configured. Set it in your .env.local file."
    );
  }

  const url = buildEndpointUrl(apiKey);
  const body = buildRequestBody(options);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Gemini AI] API Error (${response.status}):`, errText);
    throw new GeminiApiError(response.status, errText);
  }

  const resJson = await response.json();
  const text = extractResponseText(resJson);

  // If we requested structured JSON output, parse it
  if (options.responseSchema) {
    return JSON.parse(text) as T;
  }

  // Otherwise return raw text wrapped in an object
  return { text } as unknown as T;
}

// ─── Module Info (for debugging) ────────────────────────────────────────────────

export const GEMINI_CONFIG = {
  model: GEMINI_MODEL,
  apiVersion: GEMINI_API_VERSION,
  baseUrl: GEMINI_BASE_URL,
} as const;
