"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { applySale, listCategories } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/features/admin/use-admin-data";
import { toast } from "@/store/toast-store";

// Festival sale: one discount on a whole category or the store, with an end date.
export default function AdminSale() {
  const { data: categories } = useAdminData(listCategories);
  const [categoryId, setCategoryId] = useState("");
  const [discount, setDiscount] = useState("20");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);

  // Sends the sale to the backend; percent 0 removes the discount.
  async function run(discountPercent: number) {
    const where = categoryId ? "this category" : "every product";
    const action =
      discountPercent > 0
        ? `Put ${discountPercent}% off on ${where}?`
        : `Remove the discount from ${where}?`;
    if (!window.confirm(action)) return;

    setBusy(true);
    try {
      const result = await applySale({
        ...(categoryId && { categoryId }),
        discountPercent,
        ...(discountPercent > 0 &&
          endsAt && { offerEndsAt: new Date(endsAt).toISOString() }),
      });
      toast.success(`${result.updated} products updated`);
    } catch (error) {
      toast.error(errorMessage(error, "Could not update the sale"));
    } finally {
      setBusy(false);
    }
  }

  const percent = Number(discount);
  const validPercent =
    Number.isInteger(percent) && percent >= 1 && percent <= 90;

  return (
    <div className="max-w-xl card p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <BadgePercent className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-extrabold">Festival sale</h2>
          <p className="text-xs text-muted">
            Replaces the current discount on every selected product.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Products</span>
          <select
            className="field"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Whole store</option>
            {categories?.map((category) => (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>All {category.name}</option>
                {category.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Discount %
            </span>
            <input
              className="field"
              type="number"
              min={1}
              max={90}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Sale ends{" "}
              <span className="font-medium text-muted">(optional)</span>
            </span>
            <input
              className="field"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => run(percent)}
            loading={busy}
            disabled={!validPercent}
          >
            Start sale
          </Button>
          <Button variant="outline" onClick={() => run(0)} disabled={busy}>
            End sale
          </Button>
        </div>
      </div>
    </div>
  );
}
