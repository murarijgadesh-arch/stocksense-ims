import { AlertTriangle, Inbox, Package, SlidersHorizontal, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KPIS = [
  { label: "Total Products", value: "1,245", hint: "Across 8 warehouses", icon: Package, tone: "primary" },
  { label: "Low / Out of Stock", value: "12", hint: "Needs reordering", icon: AlertTriangle, tone: "destructive" },
  { label: "Pending Receipts", value: "5", hint: "Awaiting put-away", icon: Inbox, tone: "warning" },
  { label: "Pending Deliveries", value: "8", hint: "Ready to dispatch", icon: Truck, tone: "success" },
] as const;

const LOW_STOCK_ALERTS = [
  { sku: "SKU-10388", name: "USB-C Dock Station", current: 12, threshold: 20, warehouse: "North Hub" },
  { sku: "SKU-10712", name: "Pallet Wrap Heavy", current: 9, threshold: 18, warehouse: "North Hub" },
  { sku: "SKU-10440", name: "Stainless Bolt M8", current: 0, threshold: 25, warehouse: "Port Annex" },
  { sku: "SKU-10874", name: "Industrial Sensor Kit", current: 22, threshold: 30, warehouse: "Central Depot" },
  { sku: "SKU-10991", name: "Steel Bracket 120mm", current: 5, threshold: 18, warehouse: "North Hub" },
  { sku: "SKU-11042", name: "Conveyor Belt Strip", current: 0, threshold: 35, warehouse: "Port Annex" },
];

const TONE: Record<string, string> = {
  primary: "bg-accent text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/20 text-warning-foreground",
  success: "bg-success/15 text-success",
};

const FILTERS: { label: string; options: [string, ...string[]] }[] = [
  { label: "Document Type", options: ["All documents", "Receipt", "Delivery", "Adjustment", "Transfer"] },
  { label: "Status", options: ["Any status", "Draft", "Pending", "Completed", "Cancelled"] },
  { label: "Warehouse", options: ["All warehouses", "Central Depot", "North Hub", "Port Annex", "Retail Backstore"] },
  { label: "Category", options: ["All categories", "Electronics", "Packaging", "Raw materials", "Spare parts"] },
];

const ROWS: [string, string, string, string, string][] = [
  ["RCP-2041", "Receipt", "Central Depot", "Pending", "Sep 24"],
  ["DLV-1188", "Delivery", "North Hub", "Completed", "Sep 24"],
  ["ADJ-0342", "Adjustment", "Port Annex", "Draft", "Sep 23"],
  ["DLV-1187", "Delivery", "Retail Backstore", "Pending", "Sep 23"],
  ["RCP-2040", "Receipt", "Central Depot", "Completed", "Sep 22"],
  ["TRF-2718", "Transfer", "North Hub", "Pending", "Sep 22"],
  ["RCP-2039", "Receipt", "Port Annex", "Completed", "Sep 21"],
  ["ADJ-0338", "Adjustment", "Central Depot", "Completed", "Sep 21"],
];

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-warning/20 text-warning-foreground",
  Completed: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
};

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(({ label, value, hint, icon: Icon, tone }) => (
          <Card key={label} className="shadow-card">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
              <span className={`flex size-11 items-center justify-center rounded-xl ${TONE[tone]}`}>
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Inventory health",
            text: "3 SKUs are approaching the reorder threshold across the network.",
            detail: "Reorder queue: 2 urgent",
          },
          {
            title: "Put-away speed",
            text: "Receipts are moving 14% faster than last week with tighter warehouse routing.",
            detail: "Timeliness: 94% on plan",
          },
          {
            title: "Warehouse focus",
            text: "North Hub and Port Annex need follow-up on open discrepancies before close of day.",
            detail: "Open actions: 7",
          },
        ].map((item) => (
          <Card key={item.title} className="shadow-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-foreground">{item.text}</p>
              <p className="mt-4 text-xs font-medium text-primary">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Operational snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Cycle count completion", value: 82, tone: "bg-primary" },
            { label: "Transfer clearance", value: 67, tone: "bg-success" },
            { label: "Issue resolution", value: 91, tone: "bg-warning" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{metric.label}</span>
                <span className="font-medium text-foreground">{metric.value}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${metric.tone}`} style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="size-4 text-primary" /> Dynamic Filters
          </CardTitle>
          <Button variant="ghost" size="sm">
            Reset
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          {FILTERS.map(({ label, options }) => (
            <div key={label} className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
              <Select defaultValue={options[0]}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-warning" /> Low stock alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {LOW_STOCK_ALERTS.map((alert) => (
              <div key={alert.sku} className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{alert.sku}</p>
                    <p className="text-sm text-muted-foreground">{alert.name}</p>
                  </div>
                  <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                    Low stock
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Current: <span className="font-medium text-foreground">{alert.current}</span>
                  </p>
                  <p>
                    Threshold: <span className="font-medium text-foreground">{alert.threshold}</span>
                  </p>
                  <p>Warehouse: {alert.warehouse}</p>
                </div>
                <Button variant="outline" className="mt-4 w-full" size="sm">
                  Inspect stock
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Recent documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map(([ref, type, wh, status, date]) => (
                <TableRow key={ref}>
                  <TableCell className="font-medium">{ref}</TableCell>
                  <TableCell className="text-muted-foreground">{type}</TableCell>
                  <TableCell className="text-muted-foreground">{wh}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_STYLE[status]}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
