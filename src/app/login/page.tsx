import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in → go to the dashboard.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Package className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Voice Shipment Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </div>
        </div>
        <div className="glass rounded-2xl border border-border/60 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
