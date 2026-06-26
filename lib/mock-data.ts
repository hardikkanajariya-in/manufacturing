import type {
  Employee,
  PlantUnit,
  Product,
  RawMaterial,
  RestockRecord,
  SaleRecord,
  StockMovement,
  Supplier,
  WorkOrder,
} from "@/lib/types";
import { generateMockHistory } from "@/lib/generate-mock-history";

export const DEFAULT_UNIT_ID = "unit-1";

export const initialUnits: PlantUnit[] = [
  {
    id: "unit-1",
    code: "U4",
    name: "CementPro Factory — Unit 4",
    location: "Sector 12, Industrial Area, Gujarat",
    isActive: true,
  },
  {
    id: "unit-2",
    code: "U7",
    name: "CementPro Factory — Unit 7",
    location: "MIDC Zone, Nashik, Maharashtra",
    isActive: true,
  },
];

export const initialEmployees: Employee[] = [
  {
    id: "emp-1",
    employeeId: "CP-4902",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@cementpro.com",
    phone: "+91 98765 43210",
    role: "Manager",
    shift: "Shift A (06:00 – 14:00)",
    unitId: "unit-1",
    isActive: true,
  },
  {
    id: "emp-2",
    employeeId: "CP-8831",
    name: "Amit Patel",
    email: "operator.a@cementpro.com",
    phone: "+91 98765 12345",
    role: "Operator",
    shift: "Shift B (14:00 – 22:00)",
    unitId: "unit-1",
    isActive: true,
  },
  {
    id: "emp-3",
    employeeId: "CP-5104",
    name: "Priya Desai",
    email: "priya.desai@cementpro.com",
    phone: "+91 98200 44102",
    role: "Manager",
    shift: "Shift A (06:00 – 14:00)",
    unitId: "unit-2",
    isActive: true,
  },
  {
    id: "emp-4",
    employeeId: "CP-9012",
    name: "Vikram Singh",
    email: "vikram.singh@cementpro.com",
    phone: "+91 98110 22033",
    role: "Operator",
    shift: "Shift C (22:00 – 06:00)",
    unitId: "unit-2",
    isActive: true,
  },
];

export const initialMaterials: RawMaterial[] = [
  { id: "mat-cement", unitId: DEFAULT_UNIT_ID, name: "Cement", unit: "Kg", availableStock: 4850, minimumStock: 1000, unitCost: 12.0 },
  { id: "mat-sand", unitId: DEFAULT_UNIT_ID, name: "Sand", unit: "Kg", availableStock: 7200, minimumStock: 2000, unitCost: 2.5 },
  { id: "mat-stone-dust", unitId: DEFAULT_UNIT_ID, name: "Stone Dust", unit: "Kg", availableStock: 5400, minimumStock: 1500, unitCost: 1.8 },
  { id: "mat-fly-ash", unitId: DEFAULT_UNIT_ID, name: "Fly Ash", unit: "Kg", availableStock: 680, minimumStock: 800, unitCost: 3.5 },
  { id: "mat-water", unitId: DEFAULT_UNIT_ID, name: "Water", unit: "Litre", availableStock: 9200, minimumStock: 2000, unitCost: 0.15 },
];

export const initialSuppliers: Supplier[] = [
  {
    id: "sup-ultratech",
    unitId: DEFAULT_UNIT_ID,
    name: "Ultratech Cement Ltd",
    contact: "procurement@ultratechcement.com",
    paymentTerms: "Net 30",
    isActive: true,
    materialRates: [{ materialId: "mat-cement", unitCost: 12.0 }],
  },
  {
    id: "sup-narmada",
    unitId: DEFAULT_UNIT_ID,
    name: "Narmada Sands Ltd",
    contact: "sales@narmadasands.co.in",
    paymentTerms: "Net 30",
    isActive: true,
    materialRates: [{ materialId: "mat-sand", unitCost: 2.5 }],
  },
  {
    id: "sup-rajasthan",
    unitId: DEFAULT_UNIT_ID,
    name: "Rajasthan Crushers",
    contact: "supply@rajasthancrushers.com",
    paymentTerms: "Net 15",
    isActive: true,
    materialRates: [{ materialId: "mat-stone-dust", unitCost: 1.8 }],
  },
  {
    id: "sup-ntpc",
    unitId: DEFAULT_UNIT_ID,
    name: "NTPC Ash Division",
    contact: "flyash.sales@ntpc.co.in",
    paymentTerms: "Net 30",
    isActive: true,
    materialRates: [{ materialId: "mat-fly-ash", unitCost: 3.5 }],
  },
  {
    id: "sup-water",
    unitId: DEFAULT_UNIT_ID,
    name: "Municipal Water Board",
    contact: "support@waterboard.gov.in",
    paymentTerms: "Net 15",
    isActive: true,
    materialRates: [{ materialId: "mat-water", unitCost: 0.15 }],
  },
];

export const initialProducts: Product[] = [
  {
    id: "prod-paver",
    unitId: DEFAULT_UNIT_ID,
    name: "Paver Blocks",
    description: "Interlocking cement pavers for pavements and driveways.",
    sellingPrice: 18.0,
    finishedStock: 1240,
    formula: [
      { materialId: "mat-cement", quantity: 0.5 },
      { materialId: "mat-sand", quantity: 1.2 },
      { materialId: "mat-stone-dust", quantity: 0.8 },
      { materialId: "mat-water", quantity: 0.1 },
    ],
  },
  {
    id: "prod-kerb",
    unitId: DEFAULT_UNIT_ID,
    name: "Kerb Stones",
    description: "Precast kerb stones for road edging and landscaping.",
    sellingPrice: 55.0,
    finishedStock: 420,
    formula: [
      { materialId: "mat-cement", quantity: 0.8 },
      { materialId: "mat-sand", quantity: 1.5 },
      { materialId: "mat-stone-dust", quantity: 1.0 },
      { materialId: "mat-water", quantity: 0.15 },
    ],
  },
  {
    id: "prod-rcc",
    unitId: DEFAULT_UNIT_ID,
    name: "RCC Pipes",
    description: "Reinforced cement concrete pipes for drainage systems.",
    sellingPrice: 950.0,
    finishedStock: 68,
    formula: [
      { materialId: "mat-cement", quantity: 2.0 },
      { materialId: "mat-sand", quantity: 3.0 },
      { materialId: "mat-stone-dust", quantity: 2.5 },
      { materialId: "mat-fly-ash", quantity: 1.0 },
      { materialId: "mat-water", quantity: 0.5 },
    ],
  },
];

const generated = generateMockHistory(initialProducts, initialMaterials);

export const initialProductionRecords = generated.productionRecords;
export const initialRestocks = generated.restocks;
export const initialWorkOrders = generated.workOrders;
export const initialSales = generated.sales;
export const initialStockMovements = generated.stockMovements;
