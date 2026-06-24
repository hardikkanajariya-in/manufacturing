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

export function ManufacturingProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<RawMaterial[]>(initialMaterials);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(
    initialProductionRecords
  );

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
