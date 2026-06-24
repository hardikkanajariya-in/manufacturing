import type { Product, ProductionRecord, RawMaterial } from "@/lib/types";

export const initialMaterials: RawMaterial[] = [
  {
    id: "mat-cement",
    name: "Cement",
    unit: "Kg",
    availableStock: 4850,
    minimumStock: 1000,
  },
  {
    id: "mat-sand",
    name: "Sand",
    unit: "Kg",
    availableStock: 7200,
    minimumStock: 2000,
  },
  {
    id: "mat-stone-dust",
    name: "Stone Dust",
    unit: "Kg",
    availableStock: 5400,
    minimumStock: 1500,
  },
  {
    id: "mat-fly-ash",
    name: "Fly Ash",
    unit: "Kg",
    availableStock: 680,
    minimumStock: 800,
  },
  {
    id: "mat-water",
    name: "Water",
    unit: "Litre",
    availableStock: 9200,
    minimumStock: 2000,
  },
];

export const initialProducts: Product[] = [
  {
    id: "prod-paver",
    name: "Paver Blocks",
    description: "Interlocking cement pavers for pavements and driveways.",
    formula: [
      { materialId: "mat-cement", quantity: 0.5 },
      { materialId: "mat-sand", quantity: 1.2 },
      { materialId: "mat-stone-dust", quantity: 0.8 },
      { materialId: "mat-water", quantity: 0.1 },
    ],
  },
  {
    id: "prod-kerb",
    name: "Kerb Stones",
    description: "Precast kerb stones for road edging and landscaping.",
    formula: [
      { materialId: "mat-cement", quantity: 0.8 },
      { materialId: "mat-sand", quantity: 1.5 },
      { materialId: "mat-stone-dust", quantity: 1.0 },
      { materialId: "mat-water", quantity: 0.15 },
    ],
  },
  {
    id: "prod-rcc",
    name: "RCC Pipes",
    description: "Reinforced cement concrete pipes for drainage systems.",
    formula: [
      { materialId: "mat-cement", quantity: 2.0 },
      { materialId: "mat-sand", quantity: 3.0 },
      { materialId: "mat-stone-dust", quantity: 2.5 },
      { materialId: "mat-fly-ash", quantity: 1.0 },
      { materialId: "mat-water", quantity: 0.5 },
    ],
  },
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export const initialProductionRecords: ProductionRecord[] = [
  {
    id: "prod-rec-1",
    productId: "prod-paver",
    productName: "Paver Blocks",
    quantity: 320,
    productionDate: daysAgo(0),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 160 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 384 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 256 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 32 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-2",
    productId: "prod-kerb",
    productName: "Kerb Stones",
    quantity: 180,
    productionDate: daysAgo(0),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 144 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 270 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 180 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 27 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-3",
    productId: "prod-rcc",
    productName: "RCC Pipes",
    quantity: 45,
    productionDate: daysAgo(1),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 90 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 135 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 112.5 },
      { materialId: "mat-fly-ash", materialName: "Fly Ash", unit: "Kg", quantity: 45 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 22.5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-4",
    productId: "prod-paver",
    productName: "Paver Blocks",
    quantity: 280,
    productionDate: daysAgo(2),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 140 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 336 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 224 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 28 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-5",
    productId: "prod-kerb",
    productName: "Kerb Stones",
    quantity: 150,
    productionDate: daysAgo(3),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 120 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 225 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 150 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 22.5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-6",
    productId: "prod-paver",
    productName: "Paver Blocks",
    quantity: 400,
    productionDate: daysAgo(5),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 200 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 480 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 320 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 40 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-rec-7",
    productId: "prod-rcc",
    productName: "RCC Pipes",
    quantity: 60,
    productionDate: daysAgo(6),
    consumption: [
      { materialId: "mat-cement", materialName: "Cement", unit: "Kg", quantity: 120 },
      { materialId: "mat-sand", materialName: "Sand", unit: "Kg", quantity: 180 },
      { materialId: "mat-stone-dust", materialName: "Stone Dust", unit: "Kg", quantity: 150 },
      { materialId: "mat-fly-ash", materialName: "Fly Ash", unit: "Kg", quantity: 60 },
      { materialId: "mat-water", materialName: "Water", unit: "Litre", quantity: 30 },
    ],
    createdAt: new Date().toISOString(),
  },
];
