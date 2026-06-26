import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { formula, products } = await req.json();

    if (!formula || !Array.isArray(formula)) {
      return NextResponse.json({ error: "Formula recipe array is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local concrete chemistry model.");
      const prediction = calculateLocalRecipeAdvice(formula);
      return NextResponse.json({ data: prediction, isMock: true });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `You are an expert concrete mix design engineer and concrete chemist.
The user has mixed a precast concrete recipe. Your job is to analyze the ingredients and quantities (in Kg or Litres) and predict properties.

Recipe Ingredients:
${JSON.stringify(formula, null, 2)}

Please return:
1. predictedStrength28d: The estimated 28-day compressive strength in Megapascals (MPa). (Integer, typical range 10-60 MPa).
2. predictedStrength7d: The estimated 7-day compressive strength in Megapascals (MPa). (Integer, typically 65-75% of 28d strength).
3. crackingRisk: An evaluation of drying shrinkage or cracking risk. Must be exactly one of: "Low", "Medium", "High".
4. chemicalAnalysis: A 1-2 sentence description explaining the chemistry of the mix (e.g. hydration reaction, pozzolanic activity of fly ash, water-binder ratio).
5. advice: Bulleted recommendations to optimize the mix for strength or cost (e.g. "Water-cement ratio is slightly high at 0.52. Lowering water by 10L will raise strength by 5 MPa").

Return a structured JSON output conforming to the response schema.`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            predictedStrength28d: { type: "INTEGER", description: "Predicted 28-day concrete strength in MPa." },
            predictedStrength7d: { type: "INTEGER", description: "Predicted 7-day concrete strength in MPa." },
            crackingRisk: { type: "STRING", enum: ["Low", "Medium", "High"], description: "Risk of concrete cracking." },
            chemicalAnalysis: { type: "STRING", description: "Brief scientific description of the mix behavior." },
            advice: { type: "STRING", description: "Plaintext suggestions for optimization (bullet points or sentences)." }
          },
          required: ["predictedStrength28d", "predictedStrength7d", "crackingRisk", "chemicalAnalysis", "advice"]
        }
      }
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini Recipe API error response:", errText);
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
    console.error("Error in Gemini Recipe API route:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Local simulation of Abrams' concrete strength calculations based on Water-to-Binder ratios.
 */
function calculateLocalRecipeAdvice(formula: any[]) {
  // Find ingredient values from array
  let cement = 0;
  let flyash = 0;
  let water = 0;
  let sand = 0;
  let gravel = 0;

  formula.forEach((item: any) => {
    const name = item.materialName.toLowerCase();
    const qty = Number(item.quantity);
    if (name.includes("cement")) cement += qty;
    else if (name.includes("fly") || name.includes("ash")) flyash += qty;
    else if (name.includes("water")) water += qty;
    else if (name.includes("sand")) sand += qty;
    else if (name.includes("gravel") || name.includes("stone") || name.includes("aggregate")) gravel += qty;
  });

  // Calculate water-to-binder ratio (W/B)
  const binder = cement + 0.6 * flyash; // Pozzolanic factor
  const wb = binder > 0 ? water / binder : 0.6; // Default to 0.6 if no binder

  // Calculate predicted 28-day Compressive Strength (MPa) based on Abrams' Law curves
  let strength28d = 30; // base standard strength
  let crackingRisk: "Low" | "Medium" | "High" = "Low";

  if (binder === 0) {
    strength28d = 0;
    crackingRisk = "High";
  } else {
    // Abrams' law curve: strength increases as w/c ratio falls, down to 0.28 limit
    if (wb > 0.65) {
      strength28d = Math.max(5, 20 - (wb - 0.65) * 50);
      crackingRisk = "Low"; // concrete is too wet/soupy, low cracking but low strength
    } else if (wb >= 0.35 && wb <= 0.65) {
      strength28d = Math.round(15 + (0.65 - wb) * 110); // yields 15 to 48 MPa
      crackingRisk = wb < 0.42 ? "Medium" : "Low";
    } else {
      // Very dry mix (W/B < 0.35)
      strength28d = Math.max(10, Math.round(48 - (0.35 - wb) * 100)); // drops if too dry to hydrate
      crackingRisk = "High"; // high cracking risk due to dry consolidation shrinkage
    }
  }

  // 7d strength is usually ~70% of 28d strength in standard cement hydration
  const strength7d = Math.round(strength28d * 0.7);

  // Recommendations and chemistry logs
  const wCementRatio = cement > 0 ? (water / cement).toFixed(2) : "N/A";
  const chemicalAnalysis = `The mix exhibits a Water-Cement ratio of ${wCementRatio} and a binder weight of ${binder.toFixed(1)} Kg. Hydration of tricalcium silicate (C3S) drives the initial 7-day strength, while fly ash pozzolanic reactions improve long-term density.`;

  let advice = "";
  if (wb > 0.5) {
    advice = `• Reduce Water: The water-to-binder ratio is high (${wb.toFixed(2)}). Reducing water by 5-10% will densify the matrix and boost strength.
• Cost Optimization: Consider replacing 5% of cement with fly ash to reduce materials cost without losing safety limits.`;
  } else if (wb < 0.35) {
    advice = `• Increase Water: The mix is extremely dry (${wb.toFixed(2)} W/B). Hydration might stall due to lack of moisture. Raise W/B to 0.38 for better workability.
• Add plasticizer: Use a superplasticizer admixture to maintain flowability instead of raw water.`;
  } else {
    advice = `• Mix Balanced: The water-binder ratio (${wb.toFixed(2)}) is optimal for standard precast output.
• Cost Coach: You can slightly increase coarse aggregates (gravel) by 5% to reduce raw paste volumes and save costs.`;
  }

  return {
    predictedStrength28d: strength28d,
    predictedStrength7d: strength7d,
    crackingRisk,
    chemicalAnalysis,
    advice
  };
}
