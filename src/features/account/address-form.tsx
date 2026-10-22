"use client";

import { useState } from "react";
import { createAddress, updateAddress } from "@/api/account";
import { errorMessage } from "@/api/http";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";
import type { Address } from "@/lib/types";

export const MAX_ADDRESSES = 5;

type AddressFields = Omit<Address, "id" | "isDefault" | "line2"> & {
  line2: string;
};

const FIELDS: {
  name: keyof AddressFields;
  label: string;
  autoComplete: string;
  minLength?: number;
  maxLength: number;
  pattern?: string;
  placeholder?: string;
  digitsOnly?: boolean;
  wide?: boolean;
}[] = [
  {
    name: "fullName",
    label: "Full name",
    autoComplete: "name",
    minLength: 2,
    maxLength: 80,
  },
  {
    name: "phone",
    label: "Mobile number",
    autoComplete: "tel-national",
    maxLength: 10,
    pattern: "[6-9][0-9]{9}",
    placeholder: "10-digit mobile number",
    digitsOnly: true,
  },
  {
    name: "line1",
    label: "House / flat and street",
    autoComplete: "address-line1",
    minLength: 3,
    maxLength: 150,
    wide: true,
  },
  {
    name: "line2",
    label: "Landmark or area (optional)",
    autoComplete: "address-line2",
    maxLength: 150,
    wide: true,
  },
  {
    name: "city",
    label: "City",
    autoComplete: "address-level2",
    minLength: 2,
    maxLength: 60,
  },
  {
    name: "state",
    label: "State",
    autoComplete: "address-level1",
    minLength: 2,
    maxLength: 60,
  },
  {
    name: "pincode",
    label: "Pincode",
    autoComplete: "postal-code",
    maxLength: 6,
    pattern: "[1-9][0-9]{5}",
    placeholder: "6-digit pincode",
    digitsOnly: true,
  },
];

// Form to add a new address or edit one (phone and pincode take digits only).
export function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: Address;
  onSaved: (saved: Address) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddressFields>({
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    pincode: address?.pincode ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Saves the address and gives it back to the parent.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, line2: form.line2.trim() || null };
      const saved = address
        ? await updateAddress(address.id, data)
        : await createAddress(data);
      toast.success(address ? "Address updated" : "Address saved");
      onSaved(saved);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this address"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-[20px] bg-soft p-4 sm:grid-cols-2"
    >
      <h3 className="text-lg font-extrabold sm:col-span-2">
        {address ? "Edit address" : "Add address"}
      </h3>
      {FIELDS.map((field) => (
        <label
          key={field.name}
          className={`label ${field.wide ? "sm:col-span-2" : ""}`}
        >
          {field.label}
          <input
            className="field"
            name={field.name}
            autoComplete={field.autoComplete}
            required={field.name !== "line2"}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            placeholder={field.placeholder}
            inputMode={field.digitsOnly ? "numeric" : undefined}
            value={form[field.name]}
            onChange={(event) => {
              const value = field.digitsOnly
                ? event.target.value.replace(/\D/g, "")
                : event.target.value;
              setForm((current) => ({ ...current, [field.name]: value }));
            }}
          />
        </label>
      ))}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" loading={saving}>
          {address ? "Update address" : "Save address"}
        </Button>
        <Button variant="line" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
