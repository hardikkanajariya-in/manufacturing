import { NextResponse } from "next/server";
import { callGemini, isGeminiAvailable, type GeminiResponseSchema } from "@/lib/gemini";

// ─── Schema ─────────────────────────────────────────────────────────────────────

const PRODUCTION_LOG_SCHEMA: GeminiResponseSchema = {
  type: "OBJECT",
  properties: {
    productId: {
      type: "STRING",
      description: "The matched product ID from the catalog (e.g. prod-1). Null if not matched.",
    },
    quantity: {
      type: "INTEGER",
      description: "Total good yield units produced.",
    },
    scrapQuantity: {
      type: "INTEGER",
      description: "Total scrap/defective units.",
    },
    qualityStatus: {
      type: "STRING",
      enum: ["Passed", "Rework", "Failed"],
      description: "Quality verification status.",
    },
    shift: {
      type: "STRING",
      enum: ["Morning Shift", "Evening Shift", "Night Shift"],
      description: "Timing of the production run.",
    },
  },
  required: ["productId", "quantity", "scrapQuantity", "qualityStatus", "shift"],
};

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ParsedProductionLog {
  productId: string | null;
  quantity: number;
  scrapQuantity: number;
  qualityStatus: "Passed" | "Rework" | "Failed";
  shift: "Morning Shift" | "Evening Shift" | "Night Shift";
}

// ─── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { text, products } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text prompt is required" }, { status: 400 });
    }

    // Fallback to local parser if no API key
    if (!isGeminiAvailable()) {
      console.warn("[AI] GEMINI_API_KEY not configured. Using local rule-based parser.");
      const parsedData = fallbackLocalParser(text, products);
      return NextResponse.json({ data: parsedData, isMock: true });
    }

    const systemInstruction = `You are an expert shop floor manufacturing data entry assistant.
The operator will type or speak a production run summary. Your job is to extract:
1. productId: Match the mentioned product to the correct item from the catalog below. Return its exact id string. If no clear match, return null.
2. quantity: Number of good yield units produced. (Integer)
3. scrapQuantity: Number of defective or scrap units. (Integer, default to 0 if not mentioned)
4. qualityStatus: Quality result. Conforms strictly to one of: "Passed", "Rework", "Failed". (Default to "Passed" if yield is good and no failure mentioned)
5. shift: Shift timing. Must be exactly one of: "Morning Shift", "Evening Shift", "Night Shift". (Default to "Morning Shift")

Here is the current Product Catalog database:
${JSON.stringify(products, null, 2)}

Return a structured JSON output representing the parsed logging details.`;

    const result = await callGemini<ParsedProductionLog>({
      prompt: `Please parse this floor logging command: "${text}"`,
      systemInstruction,
      responseSchema: PRODUCTION_LOG_SCHEMA,
    });

    return NextResponse.json({ data: result, isMock: false });
  } catch (error: any) {
    console.error("[AI] Production log parsing error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── Local Fallback Parser ──────────────────────────────────────────────────────

/**
 * Fallback parser using regex and fuzzy matching when Gemini API Key is not configured.
 */
function fallbackLocalParser(text: string, products: any[]): ParsedProductionLog {
  const normText = text.toLowerCase();

  // 1. Match Product
  let matchedProductId = products[0]?.id || null;
  let bestMatchScore = 0;

  products.forEach((prod: any) => {
    const nameWords = prod.name.toLowerCase().split(" ");
    let score = 0;
    nameWords.forEach((word: string) => {
      if (word.length > 2 && normText.includes(word)) {
        score += 1;
      }
    });
    if (score > bestMatchScore) {
      bestMatchScore = score;
      matchedProductId = prod.id;
    }
  });

  // 2. Extract Quantities
  let quantity = 100;
  const yieldMatch =
    normText.match(/(?:log|produce|yield|made|output|run)\s*(\d+)/i) ||
    normText.match(/(\d+)\s*(units|blocks|curbs|slabs|items|qty)/i);
  if (yieldMatch) {
    quantity = parseInt(yieldMatch[1], 10);
  } else {
    const numbers = normText.match(/\b\d+\b/g);
    if (numbers && numbers.length > 0) {
      quantity = parseInt(numbers[0], 10);
    }
  }

  // 3. Scrap
  let scrapQuantity = 0;
  const scrapMatch =
    normText.match(/(\d+)\s*(?:scrap|defect|waste|fail|reject)/i) ||
    normText.match(/(?:scrap|defect|waste|fail|reject)\s*(\d+)/i);
  if (scrapMatch) {
    scrapQuantity = parseInt(scrapMatch[1], 10);
  }

  // 4. Quality Status
  let qualityStatus: "Passed" | "Rework" | "Failed" = "Passed";
  if (normText.includes("fail") || normText.includes("reject") || scrapQuantity > quantity * 0.15) {
    qualityStatus = "Failed";
  } else if (normText.includes("rework") || normText.includes("repair")) {
    qualityStatus = "Rework";
  }

  // 5. Shift
  let shift: "Morning Shift" | "Evening Shift" | "Night Shift" = "Morning Shift";
  if (normText.includes("evening") || normText.includes("shift b") || normText.includes("b shift")) {
    shift = "Evening Shift";
  } else if (normText.includes("night") || normText.includes("shift c") || normText.includes("c shift")) {
    shift = "Night Shift";
  }

  return {
    productId: matchedProductId,
    quantity,
    scrapQuantity,
    qualityStatus,
    shift,
  };
}
