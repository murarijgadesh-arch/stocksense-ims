import { Inbox, Truck, Scale, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Row = { ref: string; party: string; warehouse: string; status: string; date: string };

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
  { key: "adjustments", label: "Adjustments", icon: Scale, party: "Reason", action: "New adjustment" },
] as const;

export function OperationsView() {
  return (
    <Card className="shadow-card">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Operations Center</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage inbound receipts, outbound deliveries and stock adjustments.
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
            <TabsContent key={key} value={key} className="mt-5 space-y-4">
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
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
