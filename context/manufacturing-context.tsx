"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_UNIT_ID,
  initialEmployees,
  initialMaterials,
  initialProductionRecords,
  initialProducts,
  initialRestocks,
  initialSales,
  initialStockMovements,
  initialSuppliers,
  initialUnits,
  initialWorkOrders,
} from "@/lib/mock-data";
import { clearSession, persistActiveUnit, persistSession, readSession } from "@/lib/auth-storage";
import { formatNumber, generateId, getTodayString } from "@/lib/helpers";
import type {
  Employee,
  FormulaItem,
  MaterialConsumption,
  PlantUnit,
  Product,
  ProductionRecord,
  RawMaterial,
  RestockRecord,
  SaleRecord,
  StockMovement,
  Supplier,
  UserProfile,
  UserRole,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/types";

interface ManufacturingContextValue {
  units: PlantUnit[];
  activeUnit: PlantUnit;
  activeUnitId: string;
  setActiveUnit: (unitId: string) => void;
  addUnit: (unit: Omit<PlantUnit, "id">) => void;
  updateUnit: (id: string, unit: Partial<PlantUnit>) => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  materials: RawMaterial[];
  products: Product[];
  productionRecords: ProductionRecord[];
  restocks: RestockRecord[];
  suppliers: Supplier[];
  workOrders: WorkOrder[];
  sales: SaleRecord[];
  stockMovements: StockMovement[];
  addMaterial: (material: Omit<RawMaterial, "id" | "unitId">) => void;
  updateMaterial: (id: string, material: Omit<RawMaterial, "id" | "unitId">) => void;
  deleteMaterial: (id: string) => void;
  addProduct: (product: Omit<Product, "id" | "formula" | "sellingPrice" | "finishedStock" | "unitId"> & { sellingPrice: number }) => void;
  updateProductFormula: (productId: string, formula: FormulaItem[]) => void;
  updateProductPrice: (productId: string, sellingPrice: number) => void;
  deleteProduct: (id: string) => void;
  addRestock: (restock: Omit<RestockRecord, "id" | "createdAt" | "unitId">) => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "unitId">) => void;
  updateSupplier: (id: string, supplier: Omit<Supplier, "id" | "unitId">) => void;
  deleteSupplier: (id: string) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, "id" | "woNumber" | "createdAt" | "unitId">) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => void;
  updateWorkOrder: (id: string, fields: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  submitProduction: (
    productId: string,
    quantity: number,
    scrapQuantity: number,
    qualityStatus: "Passed" | "Failed" | "Rework",
    productionDate: string
  ) => ProductionRecord | null;
  recordSale: (sale: Omit<SaleRecord, "id" | "createdAt" | "unitId" | "totalAmount" | "productName">) => SaleRecord | null;
  isAuthenticated: boolean;
  user: UserProfile;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (profile: Partial<UserProfile>) => void;
}

const ManufacturingContext = createContext<ManufacturingContextValue | null>(null);

function calculateConsumption(
  product: Product,
  materials: RawMaterial[],
  quantity: number
): MaterialConsumption[] {
  return product.formula.map((item) => {
    const material = materials.find((m) => m.id === item.materialId);
    return {
      materialId: item.materialId,
      materialName: material?.name ?? "Unknown",
      unit: material?.unit ?? "Kg",
      quantity: item.quantity * quantity,
      unitCost: material?.unitCost ?? 0,
    };
  });
}

const defaultUser: UserProfile = {
  id: "emp-1",
  name: "Rajesh Sharma",
  role: "Manager",
  email: "rajesh.sharma@cementpro.com",
  employeeId: "CP-4902",
  shift: "Shift A (06:00 – 14:00)",
  phone: "+91 98765 43210",
  unitId: DEFAULT_UNIT_ID,
};

const operatorUser: UserProfile = {
  id: "emp-2",
  name: "Amit Patel",
  role: "Operator",
  email: "operator.a@cementpro.com",
  employeeId: "CP-8831",
  shift: "Shift B (14:00 – 22:00)",
  phone: "+91 98765 12345",
  unitId: DEFAULT_UNIT_ID,
};

function employeeToProfile(employee: Employee): UserProfile {
  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    email: employee.email,
    employeeId: employee.employeeId,
    shift: employee.shift,
    phone: employee.phone,
    unitId: employee.unitId,
  };
}

export function ManufacturingProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<PlantUnit[]>(initialUnits);
  const [activeUnitId, setActiveUnitId] = useState<string>(DEFAULT_UNIT_ID);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(initialProductionRecords);
  const [restocks, setRestocks] = useState<RestockRecord[]>(initialRestocks);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile>(defaultUser);

  useEffect(() => {
    const session = readSession();
    if (session.isAuthenticated && session.user) {
      setIsAuthenticated(true);
      setUser(session.user);
      if (session.activeUnitId) {
        setActiveUnitId(session.activeUnitId);
      } else {
        setActiveUnitId(session.user.unitId);
      }
    }
  }, []);

  const activeUnit = useMemo(
    () => units.find((unit) => unit.id === activeUnitId) ?? units[0],
    [units, activeUnitId]
  );

  const scopedMaterials = useMemo(
    () => materials.filter((item) => item.unitId === activeUnitId),
    [materials, activeUnitId]
  );
  const scopedProducts = useMemo(
    () => products.filter((item) => item.unitId === activeUnitId),
    [products, activeUnitId]
  );
  const scopedProductionRecords = useMemo(
    () => productionRecords.filter((item) => item.unitId === activeUnitId),
    [productionRecords, activeUnitId]
  );
  const scopedRestocks = useMemo(
    () => restocks.filter((item) => item.unitId === activeUnitId),
    [restocks, activeUnitId]
  );
  const scopedSuppliers = useMemo(
    () => suppliers.filter((item) => item.unitId === activeUnitId),
    [suppliers, activeUnitId]
  );
  const scopedWorkOrders = useMemo(
    () => workOrders.filter((item) => item.unitId === activeUnitId),
    [workOrders, activeUnitId]
  );
  const scopedSales = useMemo(
    () => sales.filter((item) => item.unitId === activeUnitId),
    [sales, activeUnitId]
  );
  const scopedStockMovements = useMemo(
    () => stockMovements.filter((item) => item.unitId === activeUnitId),
    [stockMovements, activeUnitId]
  );
  const scopedEmployees = useMemo(
    () => employees.filter((item) => item.unitId === activeUnitId),
    [employees, activeUnitId]
  );

  const setActiveUnit = useCallback(
    (unitId: string) => {
      setActiveUnitId(unitId);
      persistActiveUnit(unitId);
    },
    []
  );

  const addUnit = useCallback((unit: Omit<PlantUnit, "id">) => {
    setUnits((prev) => [...prev, { ...unit, id: generateId("unit") }]);
  }, []);

  const updateUnit = useCallback((id: string, unit: Partial<PlantUnit>) => {
    setUnits((prev) => prev.map((item) => (item.id === id ? { ...item, ...unit } : item)));
  }, []);

  const addEmployee = useCallback((employee: Omit<Employee, "id">) => {
    setEmployees((prev) => [...prev, { ...employee, id: generateId("emp") }]);
  }, []);

  const updateEmployee = useCallback((id: string, employee: Partial<Employee>) => {
    setEmployees((prev) => prev.map((item) => (item.id === id ? { ...item, ...employee } : item)));
  }, []);

  const login = useCallback(
    (email: string, password: string): boolean => {
      const formattedEmail = email.toLowerCase();
      if (!formattedEmail.endsWith("@cementpro.com") || password !== "password") {
        return false;
      }

      const matched = employees.find(
        (employee) => employee.email.toLowerCase() === formattedEmail && employee.isActive
      );

      let profile: UserProfile;
      if (matched) {
        profile = employeeToProfile(matched);
      } else if (formattedEmail.includes("operator") || formattedEmail.includes("amit")) {
        profile = operatorUser;
      } else {
        profile = defaultUser;
      }

      setIsAuthenticated(true);
      setUser(profile);
      setActiveUnitId(profile.unitId);
      persistSession(profile, profile.unitId);
      return true;
    },
    [employees]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(defaultUser);
    clearSession();
  }, []);

  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...profile };
      if (isAuthenticated) {
        persistSession(next, activeUnitId);
      }
      return next;
    });
  }, [activeUnitId, isAuthenticated]);

  const appendStockMovements = useCallback(
    (entries: Omit<StockMovement, "id" | "createdAt">[]) => {
      if (entries.length === 0) return;
      setStockMovements((prev) => [
        ...entries.map((entry) => ({
          ...entry,
          id: generateId("mov"),
          createdAt: new Date().toISOString(),
        })),
        ...prev,
      ]);
    },
    []
  );

  const addMaterial = useCallback(
    (material: Omit<RawMaterial, "id" | "unitId">) => {
      const id = generateId("mat");
      setMaterials((prev) => [...prev, { ...material, id, unitId: activeUnitId }]);

      if (material.availableStock > 0) {
        appendStockMovements([
          {
            unitId: activeUnitId,
            inventoryKind: "raw",
            itemId: id,
            itemName: material.name,
            quantity: material.availableStock,
            unit: material.unit,
            direction: "in",
            reason: "adjustment",
            referenceLabel: "Opening stock on material registration",
            balanceAfter: material.availableStock,
            date: getTodayString(),
          },
        ]);
      }
    },
    [activeUnitId, appendStockMovements]
  );

  const updateMaterial = useCallback(
    (id: string, material: Omit<RawMaterial, "id" | "unitId">) => {
      const existing = materials.find((item) => item.id === id);
      if (!existing) return;

      const stockDelta = material.availableStock - existing.availableStock;

      setMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...material, id, unitId: item.unitId } : item))
      );

      if (stockDelta !== 0) {
        appendStockMovements([
          {
            unitId: existing.unitId,
            inventoryKind: "raw",
            itemId: id,
            itemName: material.name,
            quantity: Math.abs(stockDelta),
            unit: material.unit,
            direction: stockDelta > 0 ? "in" : "out",
            reason: "adjustment",
            referenceLabel: `Manual edit (${formatNumber(existing.availableStock, 1)} → ${formatNumber(material.availableStock, 1)} ${material.unit})`,
            balanceAfter: material.availableStock,
            date: getTodayString(),
          },
        ]);
      }
    },
    [materials, appendStockMovements]
  );

  const deleteMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        formula: product.formula.filter((item) => item.materialId !== id),
      }))
    );
  }, []);

  const addProduct = useCallback(
    (product: Omit<Product, "id" | "formula" | "sellingPrice" | "finishedStock" | "unitId"> & { sellingPrice: number }) => {
      setProducts((prev) => [
        ...prev,
        { ...product, id: generateId("prod"), formula: [], finishedStock: 0, unitId: activeUnitId },
      ]);
    },
    [activeUnitId]
  );

  const updateProductFormula = useCallback((productId: string, formula: FormulaItem[]) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, formula } : product)));
  }, []);

  const updateProductPrice = useCallback((productId: string, sellingPrice: number) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, sellingPrice } : product))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addRestock = useCallback(
    (restock: Omit<RestockRecord, "id" | "createdAt" | "unitId">) => {
      const material = materials.find((m) => m.id === restock.materialId);
      const balanceAfter = (material?.availableStock ?? 0) + restock.quantity;

      const newRecord: RestockRecord = {
        ...restock,
        unitId: activeUnitId,
        id: generateId("rest"),
        createdAt: new Date().toISOString(),
      };
      setRestocks((prev) => [newRecord, ...prev]);
      setMaterials((prev) =>
        prev.map((mat) => {
          if (mat.id !== restock.materialId) return mat;
          const totalExistingValue = mat.availableStock * mat.unitCost;
          const totalNewValue = restock.quantity * restock.unitCost;
          const totalNewStock = mat.availableStock + restock.quantity;
          const avgCost =
            totalNewStock > 0 ? (totalExistingValue + totalNewValue) / totalNewStock : restock.unitCost;
          return {
            ...mat,
            availableStock: totalNewStock,
            unitCost: Math.round(avgCost * 100) / 100,
          };
        })
      );

      appendStockMovements([
        {
          unitId: activeUnitId,
          inventoryKind: "raw",
          itemId: restock.materialId,
          itemName: restock.materialName,
          quantity: restock.quantity,
          unit: restock.unit,
          direction: "in",
          reason: "purchase",
          referenceId: newRecord.id,
          referenceLabel: restock.invoiceNumber
            ? `Purchase ${restock.invoiceNumber}`
            : `Purchase from ${restock.supplier}`,
          balanceAfter,
          date: restock.date,
        },
      ]);
    },
    [activeUnitId, materials, appendStockMovements]
  );

  const addSupplier = useCallback(
    (supplier: Omit<Supplier, "id" | "unitId">) => {
      setSuppliers((prev) => [
        ...prev,
        { ...supplier, id: generateId("sup"), unitId: activeUnitId },
      ]);
    },
    [activeUnitId]
  );

  const updateSupplier = useCallback(
    (id: string, supplier: Omit<Supplier, "id" | "unitId">) => {
      setSuppliers((prev) =>
        prev.map((item) => (item.id === id ? { ...supplier, id, unitId: item.unitId } : item))
      );
    },
    []
  );

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addWorkOrder = useCallback(
    (wo: Omit<WorkOrder, "id" | "woNumber" | "createdAt" | "unitId">) => {
      const cleanDate = wo.scheduledDate.replace(/-/g, "");
      const woNumber = `WO-${cleanDate}-${Math.floor(100 + Math.random() * 900)}`;
      const newWo: WorkOrder = {
        ...wo,
        unitId: activeUnitId,
        id: generateId("wo"),
        woNumber,
        createdAt: new Date().toISOString(),
      };
      setWorkOrders((prev) => [newWo, ...prev]);
    },
    [activeUnitId]
  );

  const updateWorkOrderStatus = useCallback((id: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }, []);

  const updateWorkOrder = useCallback((id: string, fields: Partial<WorkOrder>) => {
    setWorkOrders((prev) => prev.map((item) => (item.id === id ? { ...item, ...fields } : item)));
  }, []);

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const submitProduction = useCallback(
    (
      productId: string,
      quantity: number,
      scrapQuantity: number,
      qualityStatus: "Passed" | "Failed" | "Rework",
      productionDate: string
    ): ProductionRecord | null => {
      const product = products.find((item) => item.id === productId && item.unitId === activeUnitId);
      if (!product || quantity <= 0 || product.formula.length === 0) return null;

      const unitMaterials = materials.filter((item) => item.unitId === activeUnitId);
      const totalUnitsToConsume = quantity + scrapQuantity;
      const consumption = calculateConsumption(product, unitMaterials, totalUnitsToConsume);

      const insufficient = consumption.some((item) => {
        const material = unitMaterials.find((m) => m.id === item.materialId);
        return !material || material.availableStock < item.quantity;
      });
      if (insufficient) return null;

      const materialCost = consumption.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
      const revenue = quantity * product.sellingPrice;
      const profit = revenue - materialCost;

      const record: ProductionRecord = {
        id: generateId("prod-rec"),
        unitId: activeUnitId,
        productId: product.id,
        productName: product.name,
        quantity,
        scrapQuantity,
        qualityStatus,
        productionDate,
        consumption,
        materialCost: Math.round(materialCost * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        createdAt: new Date().toISOString(),
      };

      setMaterials((prev) =>
        prev.map((material) => {
          const used = consumption.find((c) => c.materialId === material.id);
          if (!used) return material;
          return { ...material, availableStock: material.availableStock - used.quantity };
        })
      );

      const finishedBalanceAfter = product.finishedStock + quantity;

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, finishedStock: finishedBalanceAfter } : item
        )
      );

      const movementDate = productionDate;
      const rawMovements: Omit<StockMovement, "id" | "createdAt">[] = consumption.map((item) => {
        const material = unitMaterials.find((m) => m.id === item.materialId);
        const balanceAfter = (material?.availableStock ?? 0) - item.quantity;
        return {
          unitId: activeUnitId,
          inventoryKind: "raw" as const,
          itemId: item.materialId,
          itemName: item.materialName,
          quantity: item.quantity,
          unit: item.unit,
          direction: "out" as const,
          reason: "production_consume" as const,
          referenceId: record.id,
          referenceLabel: `Production run — ${product.name}`,
          balanceAfter,
          date: movementDate,
        };
      });

      appendStockMovements([
        ...rawMovements,
        {
          unitId: activeUnitId,
          inventoryKind: "finished",
          itemId: product.id,
          itemName: product.name,
          quantity,
          unit: "units",
          direction: "in",
          reason: "production_yield",
          referenceId: record.id,
          referenceLabel: `Production run — ${quantity} units passed`,
          balanceAfter: finishedBalanceAfter,
          date: movementDate,
        },
      ]);

      setProductionRecords((prev) => [record, ...prev]);
      return record;
    },
    [activeUnitId, materials, products, appendStockMovements]
  );

  const recordSale = useCallback(
    (
      sale: Omit<SaleRecord, "id" | "createdAt" | "unitId" | "totalAmount" | "productName">
    ): SaleRecord | null => {
      const product = products.find((item) => item.id === sale.productId && item.unitId === activeUnitId);
      if (!product || sale.quantity <= 0) return null;
      if (product.finishedStock < sale.quantity) return null;

      const totalAmount = Math.round(sale.quantity * sale.unitPrice * 100) / 100;
      const record: SaleRecord = {
        ...sale,
        unitId: activeUnitId,
        productName: product.name,
        totalAmount,
        id: generateId("sale"),
        createdAt: new Date().toISOString(),
      };

      const finishedBalanceAfter = product.finishedStock - sale.quantity;

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, finishedStock: finishedBalanceAfter } : item
        )
      );

      appendStockMovements([
        {
          unitId: activeUnitId,
          inventoryKind: "finished",
          itemId: product.id,
          itemName: product.name,
          quantity: sale.quantity,
          unit: "units",
          direction: "out",
          reason: "sale",
          referenceId: record.id,
          referenceLabel: sale.invoiceNumber
            ? `Sale ${sale.invoiceNumber} — ${sale.customerName}`
            : `Sale to ${sale.customerName}`,
          balanceAfter: finishedBalanceAfter,
          date: sale.saleDate,
        },
      ]);

      setSales((prev) => [record, ...prev]);
      return record;
    },
    [activeUnitId, products, appendStockMovements]
  );

  const value = useMemo(
    () => ({
      units,
      activeUnit,
      activeUnitId,
      setActiveUnit,
      addUnit,
      updateUnit,
      employees: scopedEmployees,
      addEmployee,
      updateEmployee,
      materials: scopedMaterials,
      products: scopedProducts,
      productionRecords: scopedProductionRecords,
      restocks: scopedRestocks,
      suppliers: scopedSuppliers,
      workOrders: scopedWorkOrders,
      sales: scopedSales,
      stockMovements: scopedStockMovements,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      updateProductPrice,
      deleteProduct,
      addRestock,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrder,
      deleteWorkOrder,
      submitProduction,
      recordSale,
      isAuthenticated,
      user,
      login,
      logout,
      updateUser,
    }),
    [
      units,
      activeUnit,
      activeUnitId,
      setActiveUnit,
      addUnit,
      updateUnit,
      scopedEmployees,
      addEmployee,
      updateEmployee,
      scopedMaterials,
      scopedProducts,
      scopedProductionRecords,
      scopedRestocks,
      scopedSuppliers,
      scopedWorkOrders,
      scopedSales,
      scopedStockMovements,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      updateProductPrice,
      deleteProduct,
      addRestock,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrder,
      deleteWorkOrder,
      submitProduction,
      recordSale,
      isAuthenticated,
      user,
      login,
      logout,
      updateUser,
    ]
  );

  return <ManufacturingContext.Provider value={value}>{children}</ManufacturingContext.Provider>;
}

export function useManufacturing() {
  const context = useContext(ManufacturingContext);
  if (!context) {
    throw new Error("useManufacturing must be used within ManufacturingProvider");
  }
  return context;
}
