"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createUser } from "@/actions/users";
import { emptyActionState } from "@/lib/types";

export function UserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    emptyActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandled = useRef(state);

  // Reset the form after a successful create. Compared by reference so it runs
  // once per submission result, not on every render.
  useEffect(() => {
    if (state !== lastHandled.current) {
      lastHandled.current = state;
      if (state.ok) {
        toast.success(state.message ?? "User created");
        formRef.current?.reset();
      }
    }
  }, [state]);

  const err = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-name">Name</Label>
          <Input id="user-name" name="name" placeholder="Jane Doe" />
          {err.name && <p className="text-xs text-destructive">{err.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            name="email"
            type="email"
            placeholder="jane@company.com"
          />
          {err.email && <p className="text-xs text-destructive">{err.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-password">Password</Label>
          <Input
            id="user-password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
          />
          {err.password && (
            <p className="text-xs text-destructive">{err.password}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-role">Role</Label>
          <Select name="role" defaultValue="USER">
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          {err.role && <p className="text-xs text-destructive">{err.role}</p>}
        </div>
      </div>

      {state.message && !state.ok && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Create user
        </Button>
      </div>
    </form>
  );
}
