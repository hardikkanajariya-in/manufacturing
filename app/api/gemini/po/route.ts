import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { supplierName, materialName, quantityNeeded, unit, unitCost, leadTime } = await req.json();

    if (!supplierName || !materialName || !quantityNeeded) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const totalValue = quantityNeeded * unitCost;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to local PO generator.");
      const prediction = generateLocalPo(supplierName, materialName, quantityNeeded, unit, unitCost, leadTime);
      return NextResponse.json({ data: prediction, isMock: true });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `You are a professional industrial procurement specialist for CementPro Factory Unit 4.
Draft a formal Purchase Order (PO) to the supplier.

Supplier details:
- Name: ${supplierName}
- Material to order: ${materialName}
- Quantity: ${quantityNeeded} ${unit}
- Unit Price: ₹${unitCost.toFixed(2)} per ${unit}
- Total Price: ₹${totalValue.toFixed(2)} INR
- Expected Lead Time: ${leadTime} days

Please return:
1. poNumber: A generated PO tracking code (e.g. PO-2026-XXXX).
2. subject: A professional email subject line for this order.
3. emailBody: A formal, polite email message body addressed to the supplier's sales representative. Request delivery within the stated lead time, list the specs, and ask for a confirmation of dispatch.
4. deliveryCommitment: A specific statement about when the order is expected (based on lead time) and delivery conditions.
5. terms: Payment conditions (typical Net 30 days) and standard receiving hours.

Return a structured JSON output conforming to the response schema.`;

    const requestBody = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            poNumber: { type: "STRING", description: "Format: PO-2026-XXXX" },
            subject: { type: "STRING", description: "Email subject line." },
            emailBody: { type: "STRING", description: "Formal procurement message body." },
            deliveryCommitment: { type: "STRING", description: "Expected delivery deadline." },
            terms: { type: "STRING", description: "Payment terms and shipping address details." }
          },
          required: ["poNumber", "subject", "emailBody", "deliveryCommitment", "terms"]
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
      console.error("Gemini PO API error response:", errText);
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
    console.error("Error in Gemini PO API route:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

function generateLocalPo(
  supplier: string,
  material: string,
  qty: number,
  unit: string,
  cost: number,
  lead: number
) {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-2026-${randNum}`;
  const total = qty * cost;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + lead);
  const formattedDelivery = deliveryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `Urgent Supply Procurement Order: ${poNumber} - CementPro Factory`;

  const emailBody = `Dear Sales Team at ${supplier},\n\nPlease find this formal procurement order from CementPro Factory (Unit 4) for the replenishment of our concrete production aggregates. We would like to purchase the following materials:\n\n• Material: ${material}\n• Order Quantity: ${qty} ${unit}\n• Contract Rate: ₹${cost.toFixed(2)} / ${unit}\n• Total Amount: ₹${total.toFixed(2)} INR\n\nPlease dispatch this cargo to our central receiving bay. As per our supplier agreements, we expect delivery within the ${lead}-day window (no later than ${formattedDelivery}).\n\nKindly reply to confirm receipt and provide dispatch details.\n\nSincerely,\nRajesh Sharma\nPlant Procurement Manager\nCementPro MES`;

  const deliveryCommitment = `Expected on-site receiving date: ${formattedDelivery} (within ${lead} days of dispatch). Standard unloading hours apply.`;

  const terms = `Payment Terms: Net 30 days invoice settlement. Receiving address: CementPro Unit 4 Warehouse, Sector 12, Industrial Area, Gujarat.`;

  return {
    poNumber,
    subject,
    emailBody,
    deliveryCommitment,
    terms,
  };
}
