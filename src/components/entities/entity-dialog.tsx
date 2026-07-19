"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { emptyActionState, type ActionState } from "@/lib/types";

/**
 * Quick-add modal for a Buyer or Factory. The action is invoked imperatively in
 * a transition so we can run success side-effects (refresh, auto-select, close)
 * right after it resolves — without reacting to state inside an effect.
 */
export function EntityDialog({
  kind,
  action,
  onCreated,
}: {
  kind: "Buyer" | "Factory";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onCreated?: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await action(emptyActionState, formData);
      if (res.ok) {
        toast.success(res.message ?? `${kind} added`);
        if (res.createdId) {
          onCreated?.(res.createdId, String(formData.get("name") ?? ""));
        }
        router.refresh();
        setError(undefined);
        setOpen(false);
      } else {
        setError(res.fieldErrors?.name ?? res.message ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setError(undefined);
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        New
      </Button>
      <DialogContent className="glass-strong sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add {kind}</DialogTitle>
          <DialogDescription>
            Create a new {kind.toLowerCase()} to use on shipments.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${kind}-name`}>{kind} name</Label>
            <Input
              id={`${kind}-name`}
              name="name"
              autoFocus
              placeholder={
                kind === "Buyer" ? "e.g. VOICE" : "e.g. Incredible Fashions"
              }
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Add {kind}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
