"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Warehouse } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber, getTodayString } from "@/lib/helpers";
import type { PaymentStatus } from "@/lib/types";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function SaleDialog({ open, onOpenChange, onSuccess }: SaleDialogProps) {
  const { products, recordSale } = useManufacturing();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");
  const [saleDate, setSaleDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    if (open) {
      setProductId(products[0]?.id ?? "");
      setQuantity("");
      setUnitPrice(products[0]?.sellingPrice.toString() ?? "");
      setCustomerName("");
      setInvoiceNumber("");
      setPaymentStatus("Pending");
      setSaleDate(getTodayString());
      setNotes("");
      setError(null);
    }
  }, [open, products]);

  const handleProductChange = (id: string | null) => {
    if (!id) return;
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setUnitPrice(product.sellingPrice.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!productId || !selectedProduct || qty <= 0 || price < 0 || !customerName.trim()) return;

    const result = recordSale({
      productId,
      quantity: qty,
      unitPrice: price,
      customerName: customerName.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      paymentStatus,
      saleDate,
      notes: notes.trim() || undefined,
    });

    if (!result) {
      setError(`Insufficient finished stock. Available: ${selectedProduct.finishedStock} units.`);
      return;
    }

    onSuccess?.(
      `${qty} units of ${selectedProduct.name} sold — warehouse stock updated.`
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record sale</DialogTitle>
          <DialogDescription>
            Deducts from the{" "}
            <Link href="/raw-materials?tab=finished" className="text-primary underline-offset-2 hover:underline">
              finished goods warehouse
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Product</Label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} — {product.finishedStock} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <Warehouse className="size-4 text-muted-foreground shrink-0" />
              <span>
                <span className="font-medium">{selectedProduct.finishedStock.toLocaleString()}</span> units available
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-qty">Quantity</Label>
              <Input id="sale-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-price">Unit price (₹)</Label>
              <Input id="sale-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer</Label>
            <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer or contractor name" required />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-invoice">Invoice no.</Label>
              <Input id="sale-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="SO-2026-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-date">Sale date</Label>
              <Input id="sale-date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment status</Label>
            <Select value={paymentStatus} onValueChange={(v) => v && setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quantity && unitPrice && (
            <div className="rounded-lg bg-muted px-3 py-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Line total</span>
              <span className="font-semibold">₹{formatNumber(Number(quantity) * Number(unitPrice), 2)}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record sale</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
