import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productionRecords, selectedProduct } = await req.json();

    if (!productionRecords || !Array.isArray(productionRecords)) {
      return NextResponse.json({ error: "Production records array is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local diagnostics auditor.");
      const analysis = runLocalDiagnostics(productionRecords, selectedProduct);
      return NextResponse.json({ data: analysis, isMock: true });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Select logs of interest to keep token context size small
    const targetLogs = selectedProduct 
      ? productionRecords.filter((r) => r.productName === selectedProduct).slice(0, 15)
      : productionRecords.slice(0, 20);

    const promptText = `You are a Senior Plant Manager and Quality Assurance Lead at CementPro Precast Units.
Analyze the following production run logs to search for anomalies, scrap spikes, shift-related defects, or machine issues.

Production Logs:
${JSON.stringify(targetLogs, null, 2)}

Please return:
1. anomalies: A detailed 2-3 sentence analysis of scrap/waste trends. Note if certain products or shifts show higher scrap rates.
2. recommendations: 2-3 specific, actionable recommendations (e.g. "Conduct mold alignment checks on the Hollow Block line," "Adjust sand moisture compensation sensors").
3. riskLevel: Overall shop floor risk rating. Must be exactly one of: "Low", "Medium", "High".

Return a structured JSON output conforming to the response schema.`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            anomalies: { type: "STRING", description: "Identified scrap trends or variances in the logs." },
            recommendations: { type: "STRING", description: "Actionable adjustments for floor operators." },
            riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"], description: "Overall quality risk level." }
          },
          required: ["anomalies", "recommendations", "riskLevel"]
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
      console.error("Gemini Diagnostics API error response:", errText);
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
    console.error("Error in Gemini Diagnostics API route:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

function runLocalDiagnostics(records: any[], product: string | null) {
  // Filter records
  const filtered = product 
    ? records.filter((r) => r.productName === product)
    : records;

  if (filtered.length === 0) {
    return {
      anomalies: "No matching production data found to run diagnostic checks.",
      recommendations: "Record production runs on the shop floor first.",
      riskLevel: "Low",
    };
  }

  // Calculate yield vs scrap
  let totalYield = 0;
  let totalScrap = 0;
  
  filtered.forEach((r) => {
    totalYield += r.quantity;
    totalScrap += r.scrapQuantity || 0;
  });

  const total = totalYield + totalScrap;
  const scrapRate = total > 0 ? (totalScrap / total) * 100 : 0;

  let anomalies = "";
  let recommendations = "";
  let riskLevel: "Low" | "Medium" | "High" = "Low";

  if (scrapRate > 4) {
    riskLevel = "Medium";
    anomalies = `Spike in defect rate detected for ${product || "various items"} averaging ${scrapRate.toFixed(1)}% scrap over the last ${filtered.length} runs. Defect logs suggest recurring minor fissures and cracks.`;
    recommendations = `• Check Curing Chamber Moisture: Hydration speeds may be causing fast drying stresses.\n• Mold Inspection: Inspect press templates on active lines for vibration wear.\n• Adjust Water Sliders: Lower water binder slightly in the product formula vat.`;
  } else if (scrapRate > 0) {
    riskLevel = "Low";
    anomalies = `Normal scrap fluctuations observed. Average reject rate is ${scrapRate.toFixed(1)}%, which sits safely below the company limit of 3.0%.`;
    recommendations = `• Routine Maintenance: Carry out weekly hydraulic pressure audits on compaction presses.\n• Sand Grading: Monitor sand moisture twice daily to maintain aggregate ratio consistency.`;
  } else {
    riskLevel = "Low";
    anomalies = "Zero defective units logged in current active data set. 100% First Pass Yield represents perfect structural outcome.";
    recommendations = `• Maintain standard parameters: Maintain the active aggregate ratios.\n• Calibrate scales: Schedule monthly calibrations for cement weighing systems.`;
  }

  return {
    anomalies,
    recommendations,
    riskLevel,
  };
}
