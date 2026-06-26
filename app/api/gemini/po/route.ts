import { NextResponse } from "next/server";
import { callGemini, isGeminiAvailable, type GeminiResponseSchema } from "@/lib/gemini";

// ─── Schema ─────────────────────────────────────────────────────────────────────

const PURCHASE_ORDER_SCHEMA: GeminiResponseSchema = {
  type: "OBJECT",
  properties: {
    poNumber: {
      type: "STRING",
      description: "Format: PO-2026-XXXX",
    },
    subject: {
      type: "STRING",
      description: "Email subject line.",
    },
    emailBody: {
      type: "STRING",
      description: "Formal procurement message body.",
    },
    deliveryCommitment: {
      type: "STRING",
      description: "Expected delivery deadline.",
    },
    terms: {
      type: "STRING",
      description: "Payment terms and shipping address details.",
    },
  },
  required: ["poNumber", "subject", "emailBody", "deliveryCommitment", "terms"],
};

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PurchaseOrderResult {
  poNumber: string;
  subject: string;
  emailBody: string;
  deliveryCommitment: string;
  terms: string;
}

// ─── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { supplierName, materialName, quantityNeeded, unit, unitCost, leadTime } = await req.json();

    if (!supplierName || !materialName || !quantityNeeded) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const totalValue = quantityNeeded * unitCost;

    // Fallback to local PO generator if no API key
    if (!isGeminiAvailable()) {
      console.warn("[AI] GEMINI_API_KEY not configured. Using local PO generator.");
      const prediction = generateLocalPo(supplierName, materialName, quantityNeeded, unit, unitCost, leadTime);
      return NextResponse.json({ data: prediction, isMock: true });
    }

    const prompt = `You are a professional industrial procurement specialist for CementPro Factory Unit 4.
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

    const result = await callGemini<PurchaseOrderResult>({
      prompt,
      responseSchema: PURCHASE_ORDER_SCHEMA,
    });

    return NextResponse.json({ data: result, isMock: false });
  } catch (error: any) {
    console.error("[AI] Purchase order generation error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── Local Fallback PO Generator ────────────────────────────────────────────────

function generateLocalPo(
  supplier: string,
  material: string,
  qty: number,
  unit: string,
  cost: number,
  lead: number
): PurchaseOrderResult {
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
