import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AppNav } from "@/components/layout/app-nav";
import { UserMenu } from "@/components/layout/user-menu";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Gate every page in this group. Redirects to /login when not signed in.
  const user = await requireUser();

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
              <Package className="size-[18px]" />
            </span>
            <span className="tracking-tight">
              Daz<span className="text-muted-foreground"> / Shipments</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <AppNav isAdmin={user.role === "ADMIN"} />
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </>
  );
}
