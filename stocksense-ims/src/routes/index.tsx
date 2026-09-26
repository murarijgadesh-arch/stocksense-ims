import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Bell } from "lucide-react";

import { AuthView } from "@/components/ims/AuthView";
import { AppSidebar, TABS, type TabKey } from "@/components/ims/Sidebar";
import { DashboardView } from "@/components/ims/Dashboard";
import { ProductsView } from "@/components/ims/Products";
import { OperationsView } from "@/components/ims/Operations";
import { SettingsViewPanel } from "@/components/ims/SettingsView";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockSense IMS — Inventory Management System" },
      {
        name: "description",
        content:
          "StockSense IMS tracks products, receipts, deliveries and adjustments across every warehouse in real time.",
      },
      { property: "og:title", content: "StockSense IMS — Inventory Management System" },
      {
        property: "og:description",
        content:
          "Track stock, receipts, deliveries and adjustments across every warehouse in one clean dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUBTITLES: Record<TabKey, string> = {
  dashboard: "Live stock health across your warehouse network.",
  products: "Browse, search and manage your product catalogue.",
  operations: "Receipts, deliveries and stock adjustments in one place.",
  settings: "Configure warehouses, company details and alerts.",
};

function Index() {
  const [user, setUser] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <>
        <AuthView onAuthenticated={setUser} />
        <Toaster />
      </>
    );
  }

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        active={tab}
        onSelect={setTab}
        onLogout={() => {
          setUser(null);
          setTab("dashboard");
        }}
        user={user}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-surface/90 px-4 py-4 backdrop-blur sm:px-8">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {current.label}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{SUBTITLES[tab]}</p>
          </div>
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8">
          {tab === "dashboard" && <DashboardView />}
          {tab === "products" && <ProductsView />}
          {tab === "operations" && <OperationsView />}
          {tab === "settings" && <SettingsViewPanel />}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
