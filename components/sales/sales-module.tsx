"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, ShoppingBag, Package, AlertCircle } from "lucide-react";
import { useManufacturing } from "@/context/manufacturing-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { formatNumber, getTodayString } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

const paymentStyles: Record<PaymentStatus, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  Partial: "bg-accent text-accent-foreground border-border",
};

export function SalesModule() {
  const { products, sales, recordSale } = useManufacturing();

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

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const unitsSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const pending = sales.filter((s) => s.paymentStatus !== "Paid").length;
    return { revenue, unitsSold, pending, count: sales.length };
  }, [sales]);

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

    setQuantity("");
    setCustomerName("");
    setInvoiceNumber("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Sales recorded</p>
            <p className="text-2xl font-bold mt-1">{totals.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Units sold</p>
            <p className="text-2xl font-bold mt-1">{formatNumber(totals.unitsSold, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Total revenue</p>
            <p className="text-2xl font-bold mt-1 text-primary">₹{formatNumber(totals.revenue, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="kpi-label">Pending payments</p>
            <p className="text-2xl font-bold mt-1">{totals.pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="section-title flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
              Record sale
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-qty" className="text-xs font-medium">Quantity</Label>
                  <Input id="sale-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sale-price" className="text-xs font-medium">Unit price (₹)</Label>
                  <Input id="sale-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required className="h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer" className="text-xs font-medium">Customer</Label>
                <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer or contractor name" required className="h-10" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-invoice" className="text-xs font-medium">Invoice no.</Label>
                  <Input id="sale-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="SO-2026-0000" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sale-date" className="text-xs font-medium">Sale date</Label>
                  <Input id="sale-date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className="h-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment status</Label>
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

              <Button type="submit" className="w-full">
                <Plus className="size-4" />
                Record sale
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="section-title flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              Finished goods inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="data-table-wrap border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Finished stock</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right pr-4">Stock value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(product.finishedStock, 0)}</TableCell>
                      <TableCell className="text-right font-mono">₹{formatNumber(product.sellingPrice, 2)}</TableCell>
                      <TableCell className="text-right font-mono pr-4">
                        ₹{formatNumber(product.finishedStock * product.sellingPrice, 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="section-title">Sales ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No sales recorded for this unit.</p>
          ) : (
            <div className="data-table-wrap border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="pr-4">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-muted-foreground">{format(new Date(sale.saleDate), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-medium">{sale.customerName}</TableCell>
                      <TableCell>{sale.productName}</TableCell>
                      <TableCell className="text-right font-mono">{sale.quantity}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">₹{formatNumber(sale.totalAmount, 2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-medium", paymentStyles[sale.paymentStatus])}>
                          {sale.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground pr-4">{sale.invoiceNumber ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
