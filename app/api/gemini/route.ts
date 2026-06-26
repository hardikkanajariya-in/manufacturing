import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, products } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local rule-based parsing engine.");
      const parsedData = fallbackLocalParser(text, products);
      return NextResponse.json({ data: parsedData, isMock: true });
    }

    // Call Google Generative Language REST API directly using fetch (no NPM packages needed)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Please parse this floor logging command: "${text}"`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            productId: { 
              type: "STRING", 
              description: "The matched product ID from the catalog (e.g. prod-1). Null if not matched." 
            },
            quantity: { 
              type: "INTEGER", 
              description: "Total good yield units produced." 
            },
            scrapQuantity: { 
              type: "INTEGER", 
              description: "Total scrap/defective units." 
            },
            qualityStatus: { 
              type: "STRING", 
              enum: ["Passed", "Rework", "Failed"],
              description: "Quality verification status."
            },
            shift: { 
              type: "STRING", 
              enum: ["Morning Shift", "Evening Shift", "Night Shift"],
              description: "Timing of the production run."
            }
          },
          required: ["productId", "quantity", "scrapQuantity", "qualityStatus", "shift"]
        }
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", errText);
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const resJson = await response.json();
    const parsedText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      throw new Error("Invalid response format received from Gemini");
    }

    const parsedData = JSON.parse(parsedText);
    return NextResponse.json({ data: parsedData, isMock: false });

  } catch (error: any) {
    console.error("Error in Gemini API route:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Fallback parser using regex and fuzzy matching in case Gemini API Key is not set up yet.
 */
function fallbackLocalParser(text: string, products: any[]) {
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
  // Regex to match quantity produced (e.g. "log 200 blocks", "produced 150", "yield is 350")
  let quantity = 100;
  const yieldMatch = normText.match(/(?:log|produce|yield|made|output|run)\s*(\d+)/i) || normText.match(/(\d+)\s*(units|blocks|curbs|slabs|items|qty)/i);
  if (yieldMatch) {
    quantity = parseInt(yieldMatch[1], 10);
  } else {
    // Fallback search for any number
    const numbers = normText.match(/\b\d+\b/g);
    if (numbers && numbers.length > 0) {
      quantity = parseInt(numbers[0], 10);
    }
  }

  // Regex to match scrap/defects (e.g. "3 scrap", "5 defects", "1 failed", "defect 4")
  let scrapQuantity = 0;
  const scrapMatch = normText.match(/(\d+)\s*(?:scrap|defect|waste|fail|reject)/i) || normText.match(/(?:scrap|defect|waste|fail|reject)\s*(\d+)/i);
  if (scrapMatch) {
    scrapQuantity = parseInt(scrapMatch[1], 10);
  }

  // 3. Extract Quality Status
  let qualityStatus = "Passed";
  if (normText.includes("fail") || normText.includes("reject") || scrapQuantity > quantity * 0.15) {
    qualityStatus = "Failed";
  } else if (normText.includes("rework") || normText.includes("repair")) {
    qualityStatus = "Rework";
  }

  // 4. Extract Shift
  let shift = "Morning Shift";
  if (normText.includes("evening") || normText.includes("shift b") || normText.includes("b shift")) {
    shift = "Evening Shift";
  } else if (normText.includes("night") || normText.includes("shift c") || normText.includes("c shift")) {
    shift = "Night Shift";
  } else if (normText.includes("morning") || normText.includes("shift a") || normText.includes("a shift")) {
    shift = "Morning Shift";
  }

  return {
    productId: matchedProductId,
    quantity,
    scrapQuantity,
    qualityStatus,
    shift
  };
}
