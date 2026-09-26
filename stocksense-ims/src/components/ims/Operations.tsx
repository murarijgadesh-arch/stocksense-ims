import { ArrowRightLeft, Inbox, Plus, Scale, Truck } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Row = { ref: string; party: string; warehouse: string; status: string; date: string };

type ProductStock = {
  sku: string;
  name: string;
  warehouse: string;
  location: string;
  available: number;
  threshold: number;
  category: string;
};

const PRODUCT_CATALOG: ProductStock[] = [
  { sku: "SKU-10231", name: "Thermal Label Roll 4x6", warehouse: "Central Depot", location: "Rack A-12", available: 1840, threshold: 150, category: "Packaging" },
  { sku: "SKU-10388", name: "USB-C Dock Station", warehouse: "North Hub", location: "Rack B-04", available: 12, threshold: 20, category: "Electronics" },
  { sku: "SKU-10440", name: "Stainless Bolt M8", warehouse: "Port Annex", location: "Rack C-02", available: 0, threshold: 25, category: "Spare parts" },
  { sku: "SKU-10512", name: "Aluminium Sheet 2mm", warehouse: "Central Depot", location: "Rack D-05", available: 326, threshold: 80, category: "Raw materials" },
  { sku: "SKU-10677", name: "Barcode Scanner X2", warehouse: "Retail Backstore", location: "Rack E-07", available: 47, threshold: 30, category: "Electronics" },
  { sku: "SKU-10712", name: "Pallet Wrap Heavy", warehouse: "North Hub", location: "Rack B-11", available: 9, threshold: 18, category: "Packaging" },
  { sku: "SKU-10821", name: "Safety Gloves L", warehouse: "Port Annex", location: "Rack C-08", available: 41, threshold: 22, category: "Warehousing" },
  { sku: "SKU-10874", name: "Industrial Sensor Kit", warehouse: "Central Depot", location: "Rack A-15", available: 22, threshold: 30, category: "Electronics" },
  { sku: "SKU-10905", name: "HDPE Trolley Bin", warehouse: "Retail Backstore", location: "Rack E-12", available: 86, threshold: 20, category: "Packaging" },
  { sku: "SKU-10991", name: "Steel Bracket 120mm", warehouse: "North Hub", location: "Rack F-03", available: 5, threshold: 18, category: "Spare parts" },
  { sku: "SKU-11042", name: "Conveyor Belt Strip", warehouse: "Port Annex", location: "Rack H-09", available: 0, threshold: 35, category: "Raw materials" },
  { sku: "SKU-11103", name: "RFID Tag Pack", warehouse: "Central Depot", location: "Rack D-09", available: 320, threshold: 45, category: "Electronics" },
];

const WAREHOUSES = ["Central Depot", "North Hub", "Port Annex", "Retail Backstore"] as const;
const WAREHOUSE_LOCATIONS: Record<string, string[]> = {
  "Central Depot": ["Rack A-12", "Rack A-15", "Rack D-05"],
  "North Hub": ["Rack B-04", "Rack B-11", "Rack F-03"],
  "Port Annex": ["Rack C-02", "Rack C-08", "Rack H-09"],
  "Retail Backstore": ["Rack E-07", "Rack E-12", "Rack G-02"],
};

const DATA: Record<string, Row[]> = {
  receipts: [
    { ref: "RCP-2041", party: "Northwind Supplies", warehouse: "Central Depot", status: "Pending", date: "Sep 24" },
    { ref: "RCP-2040", party: "Kanto Components", warehouse: "Central Depot", status: "Completed", date: "Sep 22" },
    { ref: "RCP-2039", party: "Pacific Metals", warehouse: "Port Annex", status: "Pending", date: "Sep 21" },
  ],
  deliveries: [
    { ref: "DLV-1188", party: "Bright Retail Co.", warehouse: "North Hub", status: "Completed", date: "Sep 24" },
    { ref: "DLV-1187", party: "Hargrove & Sons", warehouse: "Retail Backstore", status: "Pending", date: "Sep 23" },
    { ref: "DLV-1186", party: "Vertex Labs", warehouse: "Central Depot", status: "Pending", date: "Sep 22" },
  ],
  transfers: [
    { ref: "TRF-2718", party: "Central Depot → North Hub", warehouse: "Central Depot", status: "Pending", date: "Sep 24" },
    { ref: "TRF-2714", party: "Port Annex → Retail Backstore", warehouse: "Port Annex", status: "Completed", date: "Sep 21" },
  ],
  adjustments: [
    { ref: "ADJ-0342", party: "Cycle count", warehouse: "Port Annex", status: "Draft", date: "Sep 23" },
    { ref: "ADJ-0341", party: "Damage write-off", warehouse: "North Hub", status: "Completed", date: "Sep 20" },
  ],
};

const STATUS: Record<string, string> = {
  Pending: "bg-warning/20 text-warning-foreground",
  Completed: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
};

const TABS = [
  { key: "receipts", label: "Receipts", icon: Inbox, party: "Supplier", action: "New receipt" },
  { key: "deliveries", label: "Deliveries", icon: Truck, party: "Customer", action: "New delivery" },
  { key: "transfers", label: "Transfers", icon: ArrowRightLeft, party: "Movement", action: "New transfer" },
  { key: "adjustments", label: "Adjustments", icon: Scale, party: "Reason", action: "New adjustment" },
] as const;

const defaultTransferForm = {
  sourceWarehouse: "Central Depot",
  sourceLocation: "Rack A-12",
  productSku: "SKU-10231",
  transferQty: "",
  destinationWarehouse: "North Hub",
  destinationLocation: "Rack B-04",
};

const defaultAdjustmentForm = {
  productSku: "SKU-10231",
  location: "Rack A-12",
  recordedStock: "120",
  physicalCount: "115",
  reason: "Damaged",
  notes: "",
};

export function OperationsView() {
  const [transferForm, setTransferForm] = useState(defaultTransferForm);
  const [adjustmentForm, setAdjustmentForm] = useState(defaultAdjustmentForm);
  const [transferNotice, setTransferNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adjustmentNotice, setAdjustmentNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedTransferProduct = useMemo(
    () => PRODUCT_CATALOG.find((item) => item.sku === transferForm.productSku) ?? PRODUCT_CATALOG[0],
    [transferForm.productSku],
  );

  const transferAvailable = selectedTransferProduct?.available ?? 0;
  const transferQtyValue = Number(transferForm.transferQty || 0);
  const adjustmentRecorded = Number(adjustmentForm.recordedStock || 0);
  const adjustmentPhysical = Number(adjustmentForm.physicalCount || 0);
  const adjustmentDifference = adjustmentPhysical - adjustmentRecorded;
  const adjustmentDifferenceTone =
    adjustmentDifference > 0 ? "border-success/30 bg-success/10 text-success" : adjustmentDifference < 0 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-muted bg-muted text-foreground";

  const handleTransferSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!transferForm.sourceWarehouse.trim()) {
      setTransferNotice({ type: "error", text: "Source warehouse is required." });
      return;
    }

    if (!transferForm.destinationWarehouse.trim()) {
      setTransferNotice({ type: "error", text: "Destination warehouse is required." });
      return;
    }

    if (!transferForm.productSku.trim()) {
      setTransferNotice({ type: "error", text: "Product or SKU is required." });
      return;
    }

    const transferQty = Number(transferForm.transferQty || 0);

    if (!transferForm.transferQty || transferQty <= 0) {
      setTransferNotice({ type: "error", text: "Transfer quantity must be greater than zero." });
      return;
    }

    if (transferQty > transferAvailable) {
      setTransferNotice({ type: "error", text: `Transfer quantity cannot exceed available stock (${transferAvailable}).` });
      return;
    }

    setTransferNotice({
      type: "success",
      text: `Transfer ready: ${transferQty} units from ${transferForm.sourceWarehouse} to ${transferForm.destinationWarehouse}.`,
    });
  };

  const handleAdjustmentSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!adjustmentForm.productSku.trim()) {
      setAdjustmentNotice({ type: "error", text: "Product or SKU is required." });
      return;
    }

    if (!adjustmentForm.location.trim()) {
      setAdjustmentNotice({ type: "error", text: "Location is required." });
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      setAdjustmentNotice({ type: "error", text: "Reason is required." });
      return;
    }

    const recorded = Number(adjustmentForm.recordedStock || 0);
    const physical = Number(adjustmentForm.physicalCount || 0);

    if (Number.isNaN(recorded) || Number.isNaN(physical)) {
      setAdjustmentNotice({ type: "error", text: "Recorded and physical stock values must be numeric." });
      return;
    }

    setAdjustmentNotice({
      type: "success",
      text: `Adjustment ready: ${physical} physical count vs ${recorded} recorded stock (difference ${adjustmentPhysical - adjustmentRecorded}).`,
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Operations Center</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage inbound receipts, outbound deliveries, internal transfers and stock adjustments.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="receipts">
          <TabsList>
            {TABS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="size-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map(({ key, party, action }) => (
            <TabsContent key={key} value={key} className="mt-5 space-y-5">
              {key !== "transfers" && key !== "adjustments" && (
                <>
                  <div className="flex justify-end">
                    <Button size="sm">
                      <Plus className="size-4" /> {action}
                    </Button>
                  </div>
                  <ul className="divide-y rounded-xl border">
                    {(DATA[key] ?? []).map((row) => (
                      <li
                        key={row.ref}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                      >
                        <div>
                          <p className="font-medium">{row.ref}</p>
                          <p className="text-sm text-muted-foreground">
                            {party}: {row.party}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{row.warehouse}</span>
                          <Badge variant="secondary" className={STATUS[row.status]}>
                            {row.status}
                          </Badge>
                          <span className="w-14 text-right text-sm text-muted-foreground">{row.date}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {key === "transfers" && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">Recent transfers</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="size-4" /> New transfer
                      </Button>
                    </div>
                    <ul className="divide-y rounded-xl border bg-background">
                      {(DATA.transfers ?? []).map((row) => (
                        <li key={row.ref} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="font-medium">{row.ref}</p>
                            <p className="text-sm text-muted-foreground">{row.party}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{row.warehouse}</span>
                            <Badge variant="secondary" className={STATUS[row.status]}>
                              {row.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <form onSubmit={handleTransferSubmit} className="space-y-4 rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="size-4 text-primary" />
                      <h3 className="text-lg font-semibold">Internal transfer</h3>
                    </div>

                    <div className="space-y-2">
                      <Label>From Warehouse</Label>
                      <Select
                        value={transferForm.sourceWarehouse}
                        onValueChange={(value) => {
                          const nextLocation = WAREHOUSE_LOCATIONS[value]?.[0] ?? "";
                          setTransferForm((current) => ({ ...current, sourceWarehouse: value, sourceLocation: nextLocation }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WAREHOUSES.map((warehouse) => (
                            <SelectItem key={warehouse} value={warehouse}>
                              {warehouse}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>From Location</Label>
                      <Select
                        value={transferForm.sourceLocation}
                        onValueChange={(value) => setTransferForm((current) => ({ ...current, sourceLocation: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(WAREHOUSE_LOCATIONS[transferForm.sourceWarehouse] ?? []).map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Product / SKU</Label>
                      <Select
                        value={transferForm.productSku}
                        onValueChange={(value) => setTransferForm((current) => ({ ...current, productSku: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATALOG.map((product) => (
                            <SelectItem key={product.sku} value={product.sku}>
                              {product.sku} — {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Available Stock: <span className="font-semibold text-foreground">{transferAvailable}</span>
                    </div>

                    <div className="space-y-2">
                      <Label>Transfer Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={transferForm.transferQty}
                        onChange={(event) => setTransferForm((current) => ({ ...current, transferQty: event.target.value }))}
                        placeholder="25"
                      />
                      {transferForm.transferQty && (
                        <p
                          className={
                            transferQtyValue > 0 && transferQtyValue <= transferAvailable
                              ? "text-xs text-success"
                              : "text-xs text-destructive"
                          }
                        >
                          {transferQtyValue <= 0
                            ? "Quantity must be greater than zero."
                            : transferQtyValue > transferAvailable
                              ? `Quantity exceeds available stock (${transferAvailable}).`
                              : `Ready to transfer ${transferQtyValue} units.`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>To Warehouse</Label>
                      <Select
                        value={transferForm.destinationWarehouse}
                        onValueChange={(value) => {
                          const nextLocation = WAREHOUSE_LOCATIONS[value]?.[0] ?? "";
                          setTransferForm((current) => ({ ...current, destinationWarehouse: value, destinationLocation: nextLocation }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WAREHOUSES.map((warehouse) => (
                            <SelectItem key={warehouse} value={warehouse}>
                              {warehouse}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>To Location</Label>
                      <Select
                        value={transferForm.destinationLocation}
                        onValueChange={(value) => setTransferForm((current) => ({ ...current, destinationLocation: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(WAREHOUSE_LOCATIONS[transferForm.destinationWarehouse] ?? []).map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {transferNotice && (
                      <div
                        className={
                          transferNotice.type === "success"
                            ? "rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
                            : "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                        }
                      >
                        {transferNotice.text}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setTransferForm(defaultTransferForm)}
                      >
                        Clear
                      </Button>
                      <Button type="submit" className="flex-1">
                        Transfer Stock
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {key === "adjustments" && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">Adjustment log</h3>
                      <Button size="sm" variant="outline">
                        <Plus className="size-4" /> New adjustment
                      </Button>
                    </div>
                    <ul className="divide-y rounded-xl border bg-background">
                      {(DATA.adjustments ?? []).map((row) => (
                        <li key={row.ref} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="font-medium">{row.ref}</p>
                            <p className="text-sm text-muted-foreground">{row.party}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{row.warehouse}</span>
                            <Badge variant="secondary" className={STATUS[row.status]}>
                              {row.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <form onSubmit={handleAdjustmentSubmit} className="space-y-4 rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <Scale className="size-4 text-primary" />
                      <h3 className="text-lg font-semibold">Stock adjustment</h3>
                    </div>

                    <div className="space-y-2">
                      <Label>Product / SKU</Label>
                      <Select
                        value={adjustmentForm.productSku}
                        onValueChange={(value) => setAdjustmentForm((current) => ({ ...current, productSku: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATALOG.map((product) => (
                            <SelectItem key={product.sku} value={product.sku}>
                              {product.sku} — {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={adjustmentForm.location}
                        onChange={(event) => setAdjustmentForm((current) => ({ ...current, location: event.target.value }))}
                        placeholder="Rack A-12"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Recorded Stock</Label>
                        <Input
                          type="number"
                          value={adjustmentForm.recordedStock}
                          onChange={(event) => setAdjustmentForm((current) => ({ ...current, recordedStock: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Physical Count</Label>
                        <Input
                          type="number"
                          value={adjustmentForm.physicalCount}
                          onChange={(event) => setAdjustmentForm((current) => ({ ...current, physicalCount: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className={`rounded-md border p-3 ${adjustmentDifferenceTone}`}>
                      <p className="text-xs uppercase tracking-wide">Difference</p>
                      <p className="mt-1 text-xl font-semibold">{adjustmentDifference}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Select
                        value={adjustmentForm.reason}
                        onValueChange={(value) => setAdjustmentForm((current) => ({ ...current, reason: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Damaged', 'Cycle count', 'Shrinkage', 'Returns', 'Other'].map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={adjustmentForm.notes}
                        onChange={(event) => setAdjustmentForm((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Optional notes"
                      />
                    </div>

                    {adjustmentNotice && (
                      <div
                        className={
                          adjustmentNotice.type === "success"
                            ? "rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
                            : "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                        }
                      >
                        {adjustmentNotice.text}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setAdjustmentForm(defaultAdjustmentForm)}
                      >
                        Clear
                      </Button>
                      <Button type="submit" className="flex-1">
                        Submit Adjustment
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
