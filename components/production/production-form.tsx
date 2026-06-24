"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManufacturing } from "@/context/manufacturing-context";
import { formatNumber, getTodayString } from "@/lib/helpers";
import type { ProductionRecord } from "@/lib/types";

export function ProductionForm() {
  const { products, materials, submitProduction } = useManufacturing();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [productionDate, setProductionDate] = useState(getTodayString());
  const [lastRecord, setLastRecord] = useState<ProductionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);

  const previewConsumption =
    selectedProduct && Number(quantity) > 0
      ? selectedProduct.formula.map((item) => {
          const material = materials.find((m) => m.id === item.materialId);
          const consumed = item.quantity * Number(quantity);
          const sufficient =
            material !== undefined && material.availableStock >= consumed;
          return {
            materialId: item.materialId,
            name: material?.name ?? "Unknown",
            unit: material?.unit ?? "Kg",
            consumed,
            available: material?.availableStock ?? 0,
            after: (material?.availableStock ?? 0) - consumed,
            sufficient,
          };
        })
      : [];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLastRecord(null);

    const qty = Number(quantity);
    if (!productId || qty <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }

    if (!selectedProduct?.formula.length) {
      setError("Selected product has no formula defined.");
      return;
    }

    const record = submitProduction(productId, qty, productionDate);
    if (!record) {
      setError("Insufficient stock for one or more raw materials.");
      return;
    }

    setLastRecord(record);
    setQuantity("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Production Entry</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record daily output and auto-calculate material consumption
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select
                value={productId}
                onValueChange={(value) => value && setProductId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Produced</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-date">Production Date</Label>
                <Input
                  id="production-date"
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full sm:w-auto">
              Submit Production
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {previewConsumption.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consumed Materials (Preview)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewConsumption.map((item) => (
                    <TableRow key={item.materialId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(item.consumed, 1)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(item.available, 1)} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.sufficient ? "outline" : "destructive"}>
                          {item.sufficient ? "OK" : "Insufficient"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {lastRecord ? (
          <Card className="border-foreground/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-foreground" />
                <CardTitle className="text-base">Production Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-medium">{lastRecord.productName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium tabular-nums">
                    {formatNumber(lastRecord.quantity)} units
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(lastRecord.productionDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Materials Deducted</p>
                  <p className="font-medium">{lastRecord.consumption.length} items</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Updated Stock</p>
                <ul className="space-y-1 text-sm">
                  {lastRecord.consumption.map((item) => {
                    const material = materials.find((m) => m.id === item.materialId);
                    return (
                      <li
                        key={item.materialId}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>{item.materialName}</span>
                        <span className="tabular-nums">
                          {formatNumber(material?.availableStock ?? 0, 1)} {item.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
