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
  initialMaterials,
  initialProductionRecords,
  initialProducts,
  initialRestocks,
  initialWorkOrders,
} from "@/lib/mock-data";
import { generateId, getTodayString } from "@/lib/helpers";
import type {
  FormulaItem,
  MaterialConsumption,
  Product,
  ProductionRecord,
  RawMaterial,
  UserProfile,
  SystemSettings,
  RestockRecord,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/types";

interface ManufacturingContextValue {
  materials: RawMaterial[];
  products: Product[];
  productionRecords: ProductionRecord[];
  restocks: RestockRecord[];
  workOrders: WorkOrder[];
  addMaterial: (material: Omit<RawMaterial, "id">) => void;
  updateMaterial: (id: string, material: Omit<RawMaterial, "id">) => void;
  deleteMaterial: (id: string) => void;
  addProduct: (product: Omit<Product, "id" | "formula" | "sellingPrice"> & { sellingPrice: number }) => void;
  updateProductFormula: (productId: string, formula: FormulaItem[]) => void;
  updateProductPrice: (productId: string, sellingPrice: number) => void;
  deleteProduct: (id: string) => void;
  addRestock: (restock: Omit<RestockRecord, "id" | "createdAt">) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, "id" | "woNumber" | "createdAt">) => void;
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
  isAuthenticated: boolean;
  user: UserProfile;
  settings: SystemSettings;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
}

const ManufacturingContext = createContext<ManufacturingContextValue | null>(
  null
);

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
  name: "Rajesh Sharma",
  role: "Manager",
  email: "rajesh.sharma@cementpro.com",
  employeeId: "CP-4902",
  shift: "Shift A (06:00 – 14:00)",
  phone: "+91 98765 43210",
};

const operatorUser: UserProfile = {
  name: "Amit Patel",
  role: "Operator",
  email: "operator.a@cementpro.com",
  employeeId: "CP-8831",
  shift: "Shift B (14:00 – 22:00)",
  phone: "+91 98765 12345",
};

const defaultSettings: SystemSettings = {
  plantName: "CementPro Factory - Unit 4",
  targetDailyOutput: {
    "Paver Blocks": 5000,
    "Kerb Stones": 2000,
    "RCC Pipes": 150,
  },
  lowStockThreshold: 1000,
  enableEmailAlerts: true,
  enableSmsAlerts: false,
};

export function ManufacturingProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(
    initialProductionRecords
  );
  const [restocks, setRestocks] = useState<RestockRecord[]>(initialRestocks);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Hydrate auth state from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mes_auth") === "true";
      if (stored) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const formattedEmail = email.toLowerCase();
    if (formattedEmail.endsWith("@cementpro.com") && password === "password") {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("mes_auth", "true");
      }
      if (formattedEmail.includes("operator") || formattedEmail.includes("amit")) {
        setUser(operatorUser);
      } else {
        setUser(defaultUser);
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mes_auth");
    }
  }, []);

  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...profile }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const addMaterial = useCallback((material: Omit<RawMaterial, "id">) => {
    setMaterials((prev) => [...prev, { ...material, id: generateId("mat") }]);
  }, []);

  const updateMaterial = useCallback(
    (id: string, material: Omit<RawMaterial, "id">) => {
      setMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...material, id } : item))
      );
    },
    []
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

  const addProduct = useCallback((product: Omit<Product, "id" | "formula" | "sellingPrice"> & { sellingPrice: number }) => {
    setProducts((prev) => [
      ...prev,
      { ...product, id: generateId("prod"), formula: [] },
    ]);
  }, []);

  const updateProductFormula = useCallback(
    (productId: string, formula: FormulaItem[]) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, formula } : product
        )
      );
    },
    []
  );

  const updateProductPrice = useCallback((productId: string, sellingPrice: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, sellingPrice } : product
      )
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addRestock = useCallback((restock: Omit<RestockRecord, "id" | "createdAt">) => {
    const newRecord: RestockRecord = {
      ...restock,
      id: generateId("rest"),
      createdAt: new Date().toISOString(),
    };
    setRestocks((prev) => [newRecord, ...prev]);

    // Update material available stock and its unitCost to match latest restock price (Weighted moving average or replacement cost)
    setMaterials((prev) =>
      prev.map((material) => {
        if (material.id === restock.materialId) {
          const totalExistingValue = material.availableStock * material.unitCost;
          const totalNewValue = restock.quantity * restock.unitCost;
          const totalNewStock = material.availableStock + restock.quantity;
          const avgCost = totalNewStock > 0 ? (totalExistingValue + totalNewValue) / totalNewStock : restock.unitCost;
          return {
            ...material,
            availableStock: totalNewStock,
            unitCost: Math.round(avgCost * 100) / 100, // round to 2 decimals
          };
        }
        return material;
      })
    );
  }, []);

  const addWorkOrder = useCallback((wo: Omit<WorkOrder, "id" | "woNumber" | "createdAt">) => {
    const cleanDate = wo.scheduledDate.replace(/-/g, "");
    const woNumber = `WO-${cleanDate}-${Math.floor(100 + Math.random() * 900)}`;
    const newWo: WorkOrder = {
      ...wo,
      id: generateId("wo"),
      woNumber,
      createdAt: new Date().toISOString(),
    };
    setWorkOrders((prev) => [newWo, ...prev]);
  }, []);

  const updateWorkOrderStatus = useCallback((id: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const updateWorkOrder = useCallback((id: string, fields: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...fields } : item))
    );
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
      const product = products.find((item) => item.id === productId);
      if (!product || quantity <= 0 || product.formula.length === 0) {
        return null;
      }

      // Raw materials are consumed for both passed items and scrap items
      const totalUnitsToConsume = quantity + scrapQuantity;
      const consumption = calculateConsumption(product, materials, totalUnitsToConsume);

      const insufficient = consumption.some((item) => {
        const material = materials.find((m) => m.id === item.materialId);
        return !material || material.availableStock < item.quantity;
      });

      if (insufficient) {
        return null;
      }

      // Compute total material costs
      const materialCost = consumption.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      );

      // Revenue is only generated by Passed/Successful units!
      const revenue = quantity * product.sellingPrice;
      const profit = revenue - materialCost;

      const record: ProductionRecord = {
        id: generateId("prod-rec"),
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
          return {
            ...material,
            availableStock: material.availableStock - used.quantity,
          };
        })
      );

      setProductionRecords((prev) => [record, ...prev]);
      return record;
    },
    [materials, products]
  );

  const value = useMemo(
    () => ({
      materials,
      products,
      productionRecords,
      restocks,
      workOrders,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      updateProductPrice,
      deleteProduct,
      addRestock,
      addWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrder,
      deleteWorkOrder,
      submitProduction,
      isAuthenticated,
      user,
      settings,
      login,
      logout,
      updateUser,
      updateSettings,
    }),
    [
      materials,
      products,
      productionRecords,
      restocks,
      workOrders,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      updateProductPrice,
      deleteProduct,
      addRestock,
      addWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrder,
      deleteWorkOrder,
      submitProduction,
      isAuthenticated,
      user,
      settings,
      login,
      logout,
      updateUser,
      updateSettings,
    ]
  );

  return (
    <ManufacturingContext.Provider value={value}>
      {children}
    </ManufacturingContext.Provider>
  );
}

export function useManufacturing() {
  const context = useContext(ManufacturingContext);
  if (!context) {
    throw new Error("useManufacturing must be used within ManufacturingProvider");
  }
  return context;
}
