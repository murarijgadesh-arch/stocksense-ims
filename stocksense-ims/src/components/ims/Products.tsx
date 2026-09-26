import { Plus, Search, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PRODUCTS = [
  ["SKU-10231", "Thermal Label Roll 4x6", "Packaging", "Central Depot", 1840, "In stock"],
  ["SKU-10388", "USB-C Dock Station", "Electronics", "North Hub", 12, "Low stock"],
  ["SKU-10440", "Stainless Bolt M8", "Spare parts", "Port Annex", 0, "Out of stock"],
  ["SKU-10512", "Aluminium Sheet 2mm", "Raw materials", "Central Depot", 326, "In stock"],
  ["SKU-10677", "Barcode Scanner X2", "Electronics", "Retail Backstore", 47, "In stock"],
  ["SKU-10712", "Pallet Wrap Heavy", "Packaging", "North Hub", 9, "Low stock"],
] as const;

const STATUS: Record<string, string> = {
  "In stock": "bg-success/15 text-success",
  "Low stock": "bg-warning/20 text-warning-foreground",
  "Out of stock": "bg-destructive/10 text-destructive",
};

export function ProductsView() {
  return (
    <Card className="shadow-card">
      <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="size-4 text-primary" /> Product catalogue
          <span className="text-sm font-normal text-muted-foreground">1,245 items</span>
        </CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search SKU or name" className="pl-9 sm:w-60" />
          </div>
          <Select defaultValue="All categories">
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All categories", "Electronics", "Packaging", "Raw materials", "Spare parts"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="size-4" /> New product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map(([sku, name, cat, wh, qty, status]) => (
                <TableRow key={sku}>
                  <TableCell className="font-medium">{sku}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat}</TableCell>
                  <TableCell className="text-muted-foreground">{wh}</TableCell>
                  <TableCell className="text-right tabular-nums">{qty}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS[status]}>
                      {status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
