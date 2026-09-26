import { Warehouse, Bell, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const WAREHOUSES = [
  ["Central Depot", "CDP", "Rotterdam, NL", "Active"],
  ["North Hub", "NHB", "Leeds, UK", "Active"],
  ["Port Annex", "PRA", "Antwerp, BE", "Active"],
  ["Retail Backstore", "RBS", "Utrecht, NL", "Paused"],
];

const TOGGLES = [
  ["Low stock alerts", "Email managers when an item drops below its reorder point."],
  ["Auto-reserve on delivery", "Reserve stock as soon as a delivery document is created."],
  ["Require adjustment approval", "A second manager must approve any stock adjustment."],
];

export function SettingsViewPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="shadow-card">
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Warehouse className="size-4 text-primary" /> Warehouses
          </CardTitle>
          <Button size="sm" variant="outline">
            Add warehouse
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {WAREHOUSES.map(([name, code, city, status]) => (
              <li key={code} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-xs font-semibold text-accent-foreground">
                    {code}
                  </span>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{city}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}
                >
                  {status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" /> Company profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input id="company" defaultValue="StockSense Logistics BV" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <Input id="currency" defaultValue="EUR" />
            </div>
            <Button className="w-full">Save changes</Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" /> Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {TOGGLES.map(([title, desc], i) => (
              <div key={title} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch defaultChecked={i !== 2} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
