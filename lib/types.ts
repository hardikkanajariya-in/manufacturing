export type MaterialUnit = "Kg" | "Litre";

export interface RawMaterial {
  id: string;
  name: string;
  unit: MaterialUnit;
  availableStock: number;
  minimumStock: number;
  unitCost: number; // Cost in INR per Kg or Litre
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
  sellingPrice: number; // Selling price in INR per unit
}

export interface MaterialConsumption {
  materialId: string;
  materialName: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number; // Cost of the material at the time of consumption
}

export interface ProductionRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number; // Successful/passed items
  scrapQuantity: number; // Defective/damaged items
  qualityStatus: "Passed" | "Failed" | "Rework";
  productionDate: string;
  consumption: MaterialConsumption[];
  materialCost: number; // Total cost of materials used (passed + scrap)
  revenue: number; // Revenue generated only by passed items
  profit: number; // Revenue - MaterialCost
  createdAt: string;
}

export type StockStatus = "Adequate" | "Low Stock" | "Critical";

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  employeeId: string;
  shift: string;
  phone: string;
}

export interface SystemSettings {
  plantName: string;
  targetDailyOutput: Record<string, number>;
  lowStockThreshold: number;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
}

export interface RestockRecord {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: MaterialUnit;
  unitCost: number;
  totalCost: number;
  supplier: string;
  date: string;
  createdAt: string;
}

export type WorkOrderStatus = "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface WorkOrder {
  id: string;
  woNumber: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  scheduledDate: string;
  status: WorkOrderStatus;
  notes?: string;
  createdAt: string;
}
