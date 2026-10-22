"use client";

import { useState } from "react";
import { applySale, listCategories } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useAdminData } from "@/features/admin/use-admin-data";
import { toast } from "@/store/toast-store";

// Starts or ends a sale on the whole store or one category.
export function AdminSale() {
  const { data: categories } = useAdminData(listCategories);
  const [categoryId, setCategoryId] = useState("");
  const [discount, setDiscount] = useState("20");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);

  const percent = Number(discount);
  const validPercent =
    Number.isInteger(percent) && percent >= 1 && percent <= 90;

  // Sets the discount (0 ends the sale) after a confirm.
  async function applyDiscount(discountPercent: number) {
    const where = categoryId ? "this category" : "every product";
    const question =
      discountPercent > 0
        ? `Put ${discountPercent}% off on ${where}? This replaces their current discount.`
        : `Remove the discount from ${where}?`;
    if (!window.confirm(question)) return;

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

  return (
    <>
      <AdminTitle title="Sale" />
      <div className="card flex max-w-xl flex-col gap-4 p-5">
        <label className="label">
          Products
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
                    {category.name} › {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Discount % (1 to 90)
            <input
              className="field"
              type="number"
              min={1}
              max={90}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </label>
          <label className="label">
            Sale ends (optional)
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
            onClick={() => applyDiscount(percent)}
            loading={busy}
            disabled={!validPercent}
          >
            Start sale
          </Button>
          <Button
            variant="line"
            onClick={() => applyDiscount(0)}
            disabled={busy}
          >
            End sale
          </Button>
        </div>
      </div>
    </>
  );
}
