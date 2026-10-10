"use client";

import { useEffect, useState } from "react";
import {
  deleteAccount,
  deleteAddress,
  getProfile,
  listAddresses,
  updateAddress,
  updateProfile,
} from "@/api/account";
import { errorMessage, logoutSession } from "@/api/http";
import { formatAddress } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { toast } from "@/store/toast-store";
import {
  AddressForm,
  MAX_ADDRESSES,
  toAddressInput,
  type AddressInput,
} from "@/features/account/address-form";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import type { Address, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";

type EditingAddress = { id: string; values: AddressInput } | null;

const DANGER_BUTTON = "btn-outline min-h-12 border-danger text-danger";

// Profile and saved addresses.
export function AccountPage() {
  const { ready } = useAuthGuard();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editing, setEditing] = useState<EditingAddress>(null);
  const [busyAddressId, setBusyAddressId] = useState("");

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setFailed(false);
    Promise.all([getProfile(), listAddresses()])
      .then(([user, savedAddresses]) => {
        setProfile(user);
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setAddresses(savedAddresses);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [ready, reloadKey]);

  // Saves name and email.
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...(name.trim() && { name: name.trim() }),
        ...(email.trim() && { email: email.trim() }),
      });
      setProfile(
        (current) =>
          current && { ...current, name: name.trim() || current.name },
      );
      toast.success("Profile updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update your profile"));
    } finally {
      setSaving(false);
    }
  }

  // Opens the form to add or edit an address.
  function openAddressForm(address?: Address) {
    setEditing(
      address ? { id: address.id, values: toAddressInput(address) } : null,
    );
    setShowAddressForm(true);
  }

  // Puts the saved address in the list.
  function handleAddressSaved(saved: Address) {
    setAddresses((current) => {
      const rest = current.map((address) =>
        address.id === saved.id
          ? saved
          : saved.isDefault
            ? { ...address, isDefault: false }
            : address,
      );
      return editing ? rest : [...rest, saved];
    });
    setShowAddressForm(false);
    setEditing(null);
  }

  // Deletes an address and reloads the list.
  async function removeAddress(id: string) {
    if (!window.confirm("Delete this saved address?")) return;
    setBusyAddressId(id);
    try {
      await deleteAddress(id);
      setAddresses(await listAddresses());
      toast.success("Address deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this address"));
    } finally {
      setBusyAddressId("");
    }
  }

  // Sets the default address.
  async function makeDefault(id: string) {
    setBusyAddressId(id);
    try {
      const updated = await updateAddress(id, { isDefault: true });
      setAddresses((current) =>
        current.map((address) =>
          address.id === id ? updated : { ...address, isDefault: false },
        ),
      );
      toast.success("Default address updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update the default address"));
    } finally {
      setBusyAddressId("");
    }
  }

  // Deletes the account after a confirm, then logs out.
  async function handleDeleteAccount() {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    try {
      await deleteAccount();
      void logoutSession();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete your account"));
    }
  }

  let body: React.ReactNode;
  if (!ready || loading) body = <ListSkeleton />;
  else if (failed)
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  else {
    const displayName = profile?.name || "ApnaKart customer";
    body = (
      <div className="flex flex-wrap items-start gap-6">
        <form
          onSubmit={saveProfile}
          className="card flex flex-[1_1_300px] flex-col gap-3 rounded-3xl p-5"
        >
          <div className="flex items-center gap-3.5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-[28px] font-extrabold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-xl font-extrabold">{displayName}</p>
              <p className="text-muted">+91 {profile?.phone}</p>
            </div>
          </div>
          <label className="flex flex-col gap-1.5 font-semibold">
            Name
            <input
              className="field"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 font-semibold">
            Mobile number
            <input
              className="field bg-soft text-muted"
              readOnly
              value={`+91 ${profile?.phone ?? ""}`}
            />
          </label>
          <label className="flex flex-col gap-1.5 font-semibold">
            Email (optional)
            <input
              className="field"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <Button type="submit" loading={saving} className="min-h-12">
            Save changes
          </Button>
          <button
            type="button"
            onClick={() => void logoutSession()}
            className={DANGER_BUTTON}
          >
            Logout
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="min-h-11 font-semibold text-danger"
          >
            Delete my account
          </button>
        </form>

        <section className="flex flex-[2_1_360px] flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Saved addresses</h2>
            {addresses.length < MAX_ADDRESSES && !showAddressForm && (
              <button
                type="button"
                onClick={() => openAddressForm()}
                className="btn-primary"
              >
                Add address
              </button>
            )}
          </div>

          {showAddressForm && (
            <AddressForm
              key={editing?.id ?? "new"}
              addressId={editing?.id}
              initial={editing?.values}
              onSaved={handleAddressSaved}
              onCancel={() => {
                setShowAddressForm(false);
                setEditing(null);
              }}
            />
          )}

          {addresses.length === 0 && !showAddressForm && (
            <p className="card p-8 text-center font-semibold">
              No saved addresses
            </p>
          )}

          {addresses.map((address) => (
            <article
              key={address.id}
              className="card flex flex-wrap items-center gap-3 p-4"
            >
              {address.isDefault && (
                <span className="rounded-full bg-ground px-3.5 py-1 font-extrabold">
                  Default
                </span>
              )}
              <div className="flex-[1_1_220px]">
                <p className="font-semibold">
                  {address.fullName} · +91 {address.phone}
                </p>
                <p className="text-muted">{formatAddress(address)}</p>
              </div>
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(address.id)}
                  disabled={busyAddressId === address.id}
                  className="btn-line"
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                onClick={() => openAddressForm(address)}
                className="btn-line"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeAddress(address.id)}
                disabled={busyAddressId === address.id}
                className="min-h-11 font-semibold text-danger"
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[32px] font-extrabold">My profile</h1>
      {body}
    </div>
  );
}
