"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteShipment } from "@/actions/shipments";

export function ShipmentRowActions({
  id,
  invoice,
}: {
  id: string;
  invoice: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/shipments/${id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmDialog
          trigger={
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          }
          title={`Delete ${invoice}?`}
          description="This permanently removes the shipment and its order numbers. Shipments with recorded payments cannot be deleted."
          confirmLabel="Delete shipment"
          onConfirm={() => deleteShipment(id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
