"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { createAddress, updateAddress } from "@/api/account";
import { errorMessage } from "@/api/http";
import { toast } from "@/store/toast-store";
import type { Address } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const MAX_ADDRESSES = 5;

export type AddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyAddress: AddressInput = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

// Form values to the API shape.
export function toAddressInput(address: Address): AddressInput {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

type AddressFormProps = {
  addressId?: string;
  initial?: AddressInput;
  onSaved: (address: Address) => void;
  onCancel: () => void;
};

// Add or edit address form.
export function AddressForm({
  addressId,
  initial = emptyAddress,
  onSaved,
  onCancel,
}: AddressFormProps) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  // Updates one field.
  function update(field: keyof AddressInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Saves the address.
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, line2: form.line2.trim() || null };
      const saved = addressId
        ? await updateAddress(addressId, payload)
        : await createAddress(payload);
      toast.success(addressId ? "Address updated" : "Address saved");
      onSaved(saved);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save this address"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-ground/60 px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
          <MapPin className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-extrabold">
            {addressId ? "Edit delivery address" : "Add delivery address"}
          </h3>
          <p className="text-[11px] font-medium text-gray-500">
            Fields marked * are required
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <FormField label="Full name" required>
          <input
            className="field"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </FormField>
        <FormField label="Mobile number" required>
          <input
            className="field"
            name="tel"
            autoComplete="tel"
            required
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(event) =>
              update(
                "phone",
                event.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="House / flat and street" required>
            <input
              className="field"
              name="address-line1"
              autoComplete="address-line1"
              required
              minLength={3}
              maxLength={150}
              value={form.line1}
              onChange={(event) => update("line1", event.target.value)}
            />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="Landmark or area" hint="Optional">
            <input
              className="field"
              name="address-line2"
              autoComplete="address-line2"
              maxLength={150}
              value={form.line2}
              onChange={(event) => update("line2", event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="City" required>
          <input
            className="field"
            name="city"
            autoComplete="address-level2"
            required
            minLength={2}
            maxLength={60}
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
          />
        </FormField>
        <FormField label="State" required>
          <input
            className="field"
            name="state"
            autoComplete="address-level1"
            required
            minLength={2}
            maxLength={60}
            value={form.state}
            onChange={(event) => update("state", event.target.value)}
          />
        </FormField>
        <FormField label="Pincode" required>
          <input
            className="field"
            name="postal-code"
            autoComplete="postal-code"
            required
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            placeholder="6-digit pincode"
            value={form.pincode}
            onChange={(event) =>
              update(
                "pincode",
                event.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
          />
        </FormField>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Button type="submit" loading={saving} className="px-6">
            {addressId ? "Update address" : "Save address"}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

// Label with an input.
function FormField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-gray-600">
        {label}
        {required && <span className="text-discount">*</span>}
        {hint && (
          <span className="ml-auto text-[10px] font-medium text-gray-400">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
