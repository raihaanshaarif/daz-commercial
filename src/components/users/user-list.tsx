"use client";

import { ShieldCheck, User as UserIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteUser } from "@/actions/users";
import { formatDate } from "@/lib/format";
import type { Role } from "@/generated/prisma/enums";

type Row = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

export function UserList({
  users,
  currentUserId,
}: {
  users: Row[];
  currentUserId: string;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl border border-border/60">
      <ul className="divide-y divide-border/60">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {u.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{u.name}</span>
                  {isSelf && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      you
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {u.email} · added {formatDate(u.createdAt)}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {u.role === "ADMIN" ? (
                  <ShieldCheck className="size-3.5" />
                ) : (
                  <UserIcon className="size-3.5" />
                )}
                {u.role === "ADMIN" ? "Admin" : "User"}
              </span>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={isSelf}
                    aria-label={`Delete ${u.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
                title={`Delete ${u.name}?`}
                description="This removes the account and signs them out immediately. This cannot be undone."
                confirmLabel="Delete user"
                onConfirm={() => deleteUser(u.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
