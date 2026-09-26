import { Boxes, LayoutDashboard, Package, ArrowLeftRight, Settings, LogOut, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type TabKey = "dashboard" | "products" | "operations" | "settings";

export const TABS: { key: TabKey; label: string; icon: typeof Boxes }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "operations", label: "Operations", icon: ArrowLeftRight },
  { key: "settings", label: "Settings & Warehouse", icon: Settings },
];

export function AppSidebar({
  active,
  onSelect,
  onLogout,
  user,
  open,
  onClose,
}: {
  active: TabKey;
  onSelect: (t: TabKey) => void;
  onLogout: () => void;
  user: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="font-semibold tracking-tight text-sidebar-accent-foreground">
              StockSense <span className="text-primary">IMS</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                onSelect(key);
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active === key
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {user.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">Inventory Manager</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="size-4.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
