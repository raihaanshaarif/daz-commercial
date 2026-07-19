"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/payments", label: "Payments", exact: false },
  { href: "/users", label: "Users", exact: false, adminOnly: true },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {links
        .filter((l) => !l.adminOnly || isAdmin)
        .map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-foreground",
                active ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              {l.label}
            </Link>
          );
        })}
    </nav>
  );
}
