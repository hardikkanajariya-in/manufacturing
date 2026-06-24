"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialMaterials,
  initialProductionRecords,
  initialProducts,
} from "@/lib/mock-data";
import { generateId } from "@/lib/helpers";
import type {
  FormulaItem,
  MaterialConsumption,
  Product,
  ProductionRecord,
  RawMaterial,
  UserProfile,
  SystemSettings,
} from "@/lib/types";

interface ManufacturingContextValue {
  materials: RawMaterial[];
  products: Product[];
  productionRecords: ProductionRecord[];
  addMaterial: (material: Omit<RawMaterial, "id">) => void;
  updateMaterial: (id: string, material: Omit<RawMaterial, "id">) => void;
  deleteMaterial: (id: string) => void;
  addProduct: (product: Omit<Product, "id" | "formula">) => void;
  updateProductFormula: (productId: string, formula: FormulaItem[]) => void;
  deleteProduct: (id: string) => void;
  submitProduction: (
    productId: string,
    quantity: number,
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
    };
  });
}

const defaultUser: UserProfile = {
  name: "Rajesh Sharma",
  role: "Plant Manager",
  email: "rajesh.sharma@cementpro.com",
  employeeId: "CP-4902",
  shift: "Shift A (06:00 – 14:00)",
  phone: "+91 98765 43210",
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mes_auth") === "true";
    }
    return false;
  });

  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  const login = useCallback((email: string, password: string): boolean => {
    if (email.toLowerCase().endsWith("@cementpro.com") && password === "password") {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("mes_auth", "true");
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

  const addProduct = useCallback((product: Omit<Product, "id" | "formula">) => {
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

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const submitProduction = useCallback(
    (
      productId: string,
      quantity: number,
      productionDate: string
    ): ProductionRecord | null => {
      const product = products.find((item) => item.id === productId);
      if (!product || quantity <= 0 || product.formula.length === 0) {
        return null;
      }

      const consumption = calculateConsumption(product, materials, quantity);
      const insufficient = consumption.some((item) => {
        const material = materials.find((m) => m.id === item.materialId);
        return !material || material.availableStock < item.quantity;
      });

      if (insufficient) {
        return null;
      }

      const record: ProductionRecord = {
        id: generateId("prod-rec"),
        productId: product.id,
        productName: product.name,
        quantity,
        productionDate,
        consumption,
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
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      deleteProduct,
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
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addProduct,
      updateProductFormula,
      deleteProduct,
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
