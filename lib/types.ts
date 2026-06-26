export type MaterialUnit = "Kg" | "Litre";

export type UserRole = "Manager" | "Operator" | "Admin";

export type PaymentStatus = "Paid" | "Pending" | "Partial";

export interface PlantUnit {
  id: string;
  code: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface RawMaterial {
  id: string;
  unitId: string;
  name: string;
  unit: MaterialUnit;
  availableStock: number;
  minimumStock: number;
  unitCost: number;
}

export interface FormulaItem {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  unitId: string;
  name: string;
  description: string;
  formula: FormulaItem[];
  sellingPrice: number;
  finishedStock: number;
}

export interface MaterialConsumption {
  materialId: string;
  materialName: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number;
}

export interface ProductionRecord {
  id: string;
  unitId: string;
  productId: string;
  productName: string;
  quantity: number;
  scrapQuantity: number;
  qualityStatus: "Passed" | "Failed" | "Rework";
  productionDate: string;
  consumption: MaterialConsumption[];
  materialCost: number;
  revenue: number;
  profit: number;
  createdAt: string;
}

export type StockStatus = "Adequate" | "Low Stock" | "Critical";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  employeeId: string;
  shift: string;
  phone: string;
  unitId: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  shift: string;
  unitId: string;
  isActive: boolean;
}

export interface RestockRecord {
  id: string;
  unitId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: MaterialUnit;
  unitCost: number;
  totalCost: number;
  supplier: string;
  invoiceNumber?: string;
  date: string;
  createdAt: string;
}

export interface SupplierMaterialRate {
  materialId: string;
  unitCost: number;
}

export interface Supplier {
  id: string;
  unitId: string;
  name: string;
  contact: string;
  paymentTerms: string;
  materialRates: SupplierMaterialRate[];
  isActive: boolean;
}

export type WorkOrderStatus = "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface WorkOrder {
  id: string;
  unitId: string;
  woNumber: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  scheduledDate: string;
  status: WorkOrderStatus;
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  unitId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  invoiceNumber?: string;
  paymentStatus: PaymentStatus;
  saleDate: string;
  notes?: string;
  createdAt: string;
}

export type InventoryKind = "raw" | "finished";

export type MovementDirection = "in" | "out";

export type MovementReason =
  | "purchase"
  | "production_consume"
  | "production_yield"
  | "sale"
  | "adjustment";

export interface StockMovement {
  id: string;
  unitId: string;
  inventoryKind: InventoryKind;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  direction: MovementDirection;
  reason: MovementReason;
  referenceId?: string;
  referenceLabel?: string;
  balanceAfter: number;
  date: string;
  createdAt: string;
}
