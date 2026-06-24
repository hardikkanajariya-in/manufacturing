export type MaterialUnit = "Kg" | "Litre";

export interface RawMaterial {
  id: string;
  name: string;
  unit: MaterialUnit;
  availableStock: number;
  minimumStock: number;
}

export interface FormulaItem {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  formula: FormulaItem[];
}

export interface MaterialConsumption {
  materialId: string;
  materialName: string;
  unit: MaterialUnit;
  quantity: number;
}

export interface ProductionRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  productionDate: string;
  consumption: MaterialConsumption[];
  createdAt: string;
}

export type StockStatus = "Adequate" | "Low Stock" | "Critical";
