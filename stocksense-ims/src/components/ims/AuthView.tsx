import { useState } from "react";
import { Boxes, ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Screen = "login" | "signup" | "forgot" | "otp" | "reset";

export function AuthView({ onAuthenticated }: { onAuthenticated: (name: string) => void }) {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  const highlights = [
    { value: "3x", label: "Faster cycle counts" },
    { value: "24/7", label: "Stock visibility" },
    { value: "99.4%", label: "Inventory accuracy" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between p-12 text-sidebar-foreground lg:flex bg-sidebar">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
            StockSense <span className="text-primary">IMS</span>
          </span>
        </div>
        <div className="max-w-md space-y-4">
          <div className="inline-flex w-fit items-center rounded-full border border-sidebar-border bg-sidebar-accent/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-accent-foreground/80">
            Warehouse ops, simplified
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-sidebar-accent-foreground">
            Every unit, every warehouse, in one clear view.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-foreground/80">
            Track receipts, deliveries and adjustments across your network with real-time stock
            accuracy, low-stock alerts, and task-ready inventory workflows.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-sidebar-border bg-sidebar-accent/10 p-3">
                <p className="text-xl font-semibold text-sidebar-accent-foreground">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-6 border-t border-sidebar-border pt-6">
          {[
            ["1,245", "Products"],
            ["8", "Warehouses"],
            ["99.4%", "Accuracy"],
          ].map(([v, k]) => (
            <div key={k}>
              <dt className="text-2xl font-semibold text-sidebar-accent-foreground">{v}</dt>
              <dd className="text-xs uppercase tracking-wide text-sidebar-foreground/70">{k}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          {screen === "login" && (
            <Form
              title="Welcome back"
              subtitle="Sign in to your manager account."
              submitLabel="Sign in"
              onSubmit={() => onAuthenticated("Alex Mercer")}
            >
              <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="manager@stocksense.io" />
              <Field id="password" label="Password" type="password" placeholder="••••••••" />
              <button
                type="button"
                onClick={() => setScreen("forgot")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password? Recover with OTP
              </button>
            </Form>
          )}

          {screen === "signup" && (
            <Form
              title="Create manager account"
              subtitle="Set up access for your warehouse team."
              submitLabel="Create account"
              onSubmit={() => onAuthenticated(name || "New Manager")}
            >
              <Field id="name" label="Full name" value={name} onChange={setName} placeholder="Alex Mercer" />
              <Field id="su-email" label="Work email" type="email" placeholder="manager@stocksense.io" />
              <Field id="su-pass" label="Password" type="password" placeholder="••••••••" />
              <Field id="su-pass2" label="Confirm password" type="password" placeholder="••••••••" />
            </Form>
          )}

          {screen === "forgot" && (
            <Form
              title="Recover access"
              subtitle="We'll email you a 6-digit verification code."
              submitLabel="Send OTP"
              onSubmit={() => {
                toast.success("Verification code sent", { description: email || "your inbox" });
                setScreen("otp");
              }}
              onBack={() => setScreen("login")}
            >
              <Field id="fp-email" label="Email" type="email" value={email} onChange={setEmail} placeholder="manager@stocksense.io" />
            </Form>
          )}

          {screen === "otp" && (
            <Form
              title="Enter verification code"
              subtitle={`Sent to ${email || "your email"}. Code expires in 10 minutes.`}
              submitLabel="Verify code"
              onSubmit={() => setScreen("reset")}
              onBack={() => setScreen("forgot")}
            >
              <div className="space-y-2">
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-12 text-center text-xl tracking-[0.5em]"
                />
              </div>
              <button
                type="button"
                onClick={() => toast.success("A new code is on its way")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Resend code
              </button>
            </Form>
          )}

          {screen === "reset" && (
            <Form
              title="Set a new password"
              subtitle="Choose a strong password of at least 8 characters."
              submitLabel="Reset password"
              icon
              onSubmit={() => {
                toast.success("Password updated. Please sign in.");
                setScreen("login");
              }}
            >
              <Field id="np" label="New password" type="password" placeholder="••••••••" />
              <Field id="np2" label="Confirm new password" type="password" placeholder="••••••••" />
            </Form>
          )}

          {(screen === "login" || screen === "signup") && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {screen === "login" ? "New to StockSense?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setScreen(screen === "login" ? "signup" : "login")}
              >
                {screen === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Form({
  title,
  subtitle,
  submitLabel,
  children,
  onSubmit,
  onBack,
  icon,
}: {
  title: string;
  subtitle: string;
  submitLabel: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onBack?: () => void;
  icon?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-5"
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
      )}
      <div className="space-y-1.5">
        {icon && (
          <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ShieldCheck className="size-5" />
          </span>
        )}
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
      <Button type="submit" className="h-11 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="h-11"
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
      />
    </div>
  );
}
