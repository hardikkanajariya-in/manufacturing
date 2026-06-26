import type {
  ProductionRecord,
  RawMaterial,
  RestockRecord,
  SaleRecord,
  StockMovement,
  WorkOrder,
  WorkOrderStatus,
  Product,
  PaymentStatus,
} from "@/lib/types";

const UNIT_ID = "unit-1";

const CUSTOMERS = [
  "Gujarat Highway Authority",
  "Shree Infra Developers",
  "Municipal Drainage Board",
  "Patel Construction Co.",
  "Ahmedabad Metro Corp",
  "Rajkot Municipal Corp",
  "Surat Builders Pvt Ltd",
  "Vadodara Civic Works",
  "Maharashtra PWD",
  "Nashik Industrial Estate",
  "Bharuch Road Projects",
  "Kutch Housing Board",
];

const SUPPLIER_BY_MATERIAL: Record<string, string> = {
  "mat-cement": "Ultratech Cement Ltd",
  "mat-sand": "Narmada Sands Ltd",
  "mat-stone-dust": "Rajasthan Crushers",
  "mat-fly-ash": "NTPC Ash Division",
  "mat-water": "Municipal Water Board",
};

const WO_STATUSES: WorkOrderStatus[] = [
  "Completed",
  "Completed",
  "Completed",
  "Cancelled",
  "Scheduled",
  "In Progress",
  "Draft",
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seeded(seed) * arr.length)];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildConsumption(
  product: Product,
  materials: RawMaterial[],
  totalUnits: number
) {
  return product.formula.map((item) => {
    const material = materials.find((m) => m.id === item.materialId);
    const qty = round2(item.quantity * totalUnits);
    return {
      materialId: item.materialId,
      materialName: material?.name ?? "Unknown",
      unit: material?.unit ?? ("Kg" as const),
      quantity: qty,
      unitCost: material?.unitCost ?? 0,
    };
  });
}

function calcMaterialCost(
  consumption: ReturnType<typeof buildConsumption>
): number {
  return round2(
    consumption.reduce((sum, c) => sum + c.quantity * c.unitCost, 0)
  );
}

export function generateMockHistory(
  products: Product[],
  materials: RawMaterial[]
) {
  const productionRecords: ProductionRecord[] = [];
  const sales: SaleRecord[] = [];
  const restocks: RestockRecord[] = [];
  const workOrders: WorkOrder[] = [];

  let prodCounter = 0;
  let saleCounter = 0;
  let restCounter = 0;
  let woCounter = 0;

  // ~6 months of history (180 days)
  for (let day = 180; day >= 0; day--) {
    const date = daysAgo(day);
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seed = day * 17;

    // Production: most weekdays, 1–2 runs
    if (!isWeekend || seeded(seed) > 0.7) {
      const runCount = isWeekend ? 1 : seeded(seed + 1) > 0.55 ? 2 : 1;
      for (let r = 0; r < runCount; r++) {
        const product = pick(products, seed + r * 3);
        const baseQty =
          product.id === "prod-paver"
            ? 180 + Math.floor(seeded(seed + r) * 220)
            : product.id === "prod-kerb"
              ? 80 + Math.floor(seeded(seed + r + 1) * 140)
              : 15 + Math.floor(seeded(seed + r + 2) * 40);
        const scrapQty = Math.max(2, Math.floor(baseQty * (0.02 + seeded(seed + r + 4) * 0.04)));
        const qualityRoll = seeded(seed + r + 5);
        const qualityStatus =
          qualityRoll > 0.92 ? "Rework" : qualityRoll > 0.98 ? "Failed" : "Passed";
        const totalConsume = baseQty + scrapQty;
        const consumption = buildConsumption(product, materials, totalConsume);
        const materialCost = calcMaterialCost(consumption);
        const revenue = round2(baseQty * product.sellingPrice);
        const profit = round2(revenue - materialCost);

        productionRecords.push({
          id: `prod-rec-h-${++prodCounter}`,
          unitId: UNIT_ID,
          productId: product.id,
          productName: product.name,
          quantity: baseQty,
          scrapQuantity: scrapQty,
          qualityStatus,
          productionDate: date,
          consumption,
          materialCost,
          revenue,
          profit,
          createdAt: new Date(date).toISOString(),
        });
      }
    }

    // Sales: ~every 3–4 days
    if (seeded(seed + 10) > 0.72) {
      const product = pick(products, seed + 11);
      const qty =
        product.id === "prod-paver"
          ? 200 + Math.floor(seeded(seed + 12) * 600)
          : product.id === "prod-kerb"
            ? 40 + Math.floor(seeded(seed + 13) * 160)
            : 4 + Math.floor(seeded(seed + 14) * 20);
      const unitPrice = product.sellingPrice * (0.95 + seeded(seed + 15) * 0.1);
      const paymentRoll = seeded(seed + 16);
      const paymentStatus: PaymentStatus =
        paymentRoll > 0.6 ? "Paid" : paymentRoll > 0.3 ? "Pending" : "Partial";
      const month = date.slice(5, 7);
      const invNum = `SO-2026-${month}-${String(++saleCounter).padStart(4, "0")}`;

      sales.push({
        id: `sale-h-${saleCounter}`,
        unitId: UNIT_ID,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: round2(unitPrice),
        totalAmount: round2(qty * unitPrice),
        customerName: pick(CUSTOMERS, seed + 17),
        invoiceNumber: invNum,
        paymentStatus,
        saleDate: date,
        notes: paymentStatus === "Partial" ? "Balance due in 15 days." : undefined,
        createdAt: new Date(date).toISOString(),
      });
    }

    // Restocks: periodic per material
    if (day % 14 === 0 || (day % 11 === 0 && seeded(seed + 20) > 0.5)) {
      const material = pick(materials, seed + 21);
      const qty =
        material.id === "mat-water"
          ? 3000 + Math.floor(seeded(seed + 22) * 5000)
          : 1500 + Math.floor(seeded(seed + 22) * 3500);
      const costVariance = 0.92 + seeded(seed + 23) * 0.12;
      const unitCost = round2(material.unitCost * costVariance);
      const invPrefix =
        material.id === "mat-cement"
          ? "INV-UT"
          : material.id === "mat-sand"
            ? "INV-NS"
            : material.id === "mat-stone-dust"
              ? "INV-RC"
              : material.id === "mat-fly-ash"
                ? "INV-NT"
                : "INV-MWB";

      restocks.push({
        id: `rest-h-${++restCounter}`,
        unitId: UNIT_ID,
        materialId: material.id,
        materialName: material.name,
        quantity: qty,
        unit: material.unit,
        unitCost,
        totalCost: round2(qty * unitCost),
        supplier: SUPPLIER_BY_MATERIAL[material.id] ?? "General Supplier",
        invoiceNumber: `${invPrefix}-${2400 + restCounter}`,
        date,
        createdAt: new Date(date).toISOString(),
      });
    }

    // Work orders: ~twice a week
    if (!isWeekend && seeded(seed + 30) > 0.65) {
      const product = pick(products, seed + 31);
      const target =
        product.id === "prod-paver"
          ? 300 + Math.floor(seeded(seed + 32) * 400)
          : product.id === "prod-kerb"
            ? 120 + Math.floor(seeded(seed + 33) * 180)
            : 25 + Math.floor(seeded(seed + 34) * 40);
      const cleanDate = date.replace(/-/g, "");
      const status = day <= 7 ? pick(WO_STATUSES.slice(4), seed) : pick(WO_STATUSES, seed);

      workOrders.push({
        id: `wo-h-${++woCounter}`,
        unitId: UNIT_ID,
        woNumber: `WO-${cleanDate}-${String(100 + woCounter).slice(-3)}`,
        productId: product.id,
        productName: product.name,
        targetQuantity: target,
        scheduledDate: date,
        status,
        notes:
          status === "In Progress"
            ? "Run in Shift A. Check water content ratio."
            : status === "Completed"
              ? "Completed as per schedule."
              : undefined,
        createdAt: new Date(date).toISOString(),
      });
    }
  }

  // Sort newest first (typical ledger display)
  productionRecords.sort(
    (a, b) => new Date(b.productionDate).getTime() - new Date(a.productionDate).getTime()
  );
  sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  restocks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  workOrders.sort(
    (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );

  const stockMovements = buildStockMovementsFromHistory(
    productionRecords,
    sales,
    restocks,
    materials,
    products
  );

  return { productionRecords, sales, restocks, workOrders, stockMovements };
}

function buildStockMovementsFromHistory(
  productionRecords: ProductionRecord[],
  sales: SaleRecord[],
  restocks: RestockRecord[],
  materials: RawMaterial[],
  products: Product[]
): StockMovement[] {
  type Event =
    | { date: string; sort: number; movement: Omit<StockMovement, "id" | "createdAt"> };

  const events: Event[] = [];
  let sort = 0;

  restocks.forEach((r) => {
    events.push({
      date: r.date,
      sort: sort++,
      movement: {
        unitId: r.unitId,
        inventoryKind: "raw",
        itemId: r.materialId,
        itemName: r.materialName,
        quantity: r.quantity,
        unit: r.unit,
        direction: "in",
        reason: "purchase",
        referenceId: r.id,
        referenceLabel: r.invoiceNumber
          ? `Purchase ${r.invoiceNumber}`
          : `Purchase from ${r.supplier}`,
        balanceAfter: 0,
        date: r.date,
      },
    });
  });

  productionRecords.forEach((rec) => {
    rec.consumption.forEach((c) => {
      events.push({
        date: rec.productionDate,
        sort: sort++,
        movement: {
          unitId: rec.unitId,
          inventoryKind: "raw",
          itemId: c.materialId,
          itemName: c.materialName,
          quantity: c.quantity,
          unit: c.unit,
          direction: "out",
          reason: "production_consume",
          referenceId: rec.id,
          referenceLabel: `Production run — ${rec.productName}`,
          balanceAfter: 0,
          date: rec.productionDate,
        },
      });
    });
    events.push({
      date: rec.productionDate,
      sort: sort++,
      movement: {
        unitId: rec.unitId,
        inventoryKind: "finished",
        itemId: rec.productId,
        itemName: rec.productName,
        quantity: rec.quantity,
        unit: "units",
        direction: "in",
        reason: "production_yield",
        referenceId: rec.id,
        referenceLabel: `Production run — ${rec.quantity} units passed`,
        balanceAfter: 0,
        date: rec.productionDate,
      },
    });
  });

  sales.forEach((s) => {
    events.push({
      date: s.saleDate,
      sort: sort++,
      movement: {
        unitId: s.unitId,
        inventoryKind: "finished",
        itemId: s.productId,
        itemName: s.productName,
        quantity: s.quantity,
        unit: "units",
        direction: "out",
        reason: "sale",
        referenceId: s.id,
        referenceLabel: s.invoiceNumber
          ? `Sale ${s.invoiceNumber} — ${s.customerName}`
          : `Sale to ${s.customerName}`,
        balanceAfter: 0,
        date: s.saleDate,
      },
    });
  });

  events.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.sort - b.sort;
  });

  const rawBalances = new Map(materials.map((m) => [m.id, 6000 + seeded(m.id.length) * 4000]));
  const finishedBalances = new Map(products.map((p) => [p.id, 200 + seeded(p.id.length) * 300]));

  const movements: StockMovement[] = [];

  events.forEach((event, index) => {
    const m = event.movement;
    let balanceAfter = 0;

    if (m.inventoryKind === "raw") {
      const current = rawBalances.get(m.itemId) ?? 0;
      balanceAfter =
        m.direction === "in" ? current + m.quantity : Math.max(0, current - m.quantity);
      rawBalances.set(m.itemId, balanceAfter);
    } else {
      const current = finishedBalances.get(m.itemId) ?? 0;
      balanceAfter =
        m.direction === "in" ? current + m.quantity : Math.max(0, current - m.quantity);
      finishedBalances.set(m.itemId, balanceAfter);
    }

    movements.push({
      ...m,
      balanceAfter: round2(balanceAfter),
      id: `mov-h-${index + 1}`,
      createdAt: new Date(m.date).toISOString(),
    });
  });

  movements.reverse();
  return movements;
}
