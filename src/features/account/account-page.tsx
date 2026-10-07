"use client";

import { useEffect, useState } from "react";
import {
  Check,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
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
} from "./address-form";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import type { Address, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";

type EditingAddress = { id: string; values: AddressInput } | null;

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

  useEffect(() => {
    if (!loading && window.location.hash === "#addresses") {
      document.getElementById("addresses")?.scrollIntoView();
    }
  }, [loading]);

  // Saves name and email.
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...(name.trim() && { name: name.trim() }),
        ...(email.trim() && { email: email.trim() }),
      });
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

  // Logs out from this device.
  function handleLogout() {
    void logoutSession();
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

  if (!ready || loading) {
    return (
      <AccountShell>
        <ListSkeleton />
      </AccountShell>
    );
  }

  if (failed) {
    return (
      <AccountShell onLogout={handleLogout}>
        <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />
      </AccountShell>
    );
  }

  return (
    <AccountShell onLogout={handleLogout}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <form
          onSubmit={saveProfile}
          className="card overflow-hidden lg:sticky lg:top-32"
        >
          <div className="bg-gradient-to-br from-accent to-violet-600 px-5 py-6 text-white">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <UserRound className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold">
              Profile details
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-gray-600 dark:text-gray-300">
                Mobile number
              </span>
              <input
                className="field bg-gray-50 text-gray-500 dark:bg-white/[0.03]"
                readOnly
                value={`+91 ${profile?.phone ?? ""}`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-gray-600 dark:text-gray-300">
                Full name
              </span>
              <input
                className="field"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-gray-600 dark:text-gray-300">
                Email address
              </span>
              <input
                className="field"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <Button type="submit" loading={saving} className="w-full">
              Save profile
            </Button>
          </div>
        </form>

        <section id="addresses" className="scroll-mt-40">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">
                Saved addresses
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Up to {MAX_ADDRESSES} delivery addresses
              </p>
            </div>
            {addresses.length < MAX_ADDRESSES && !showAddressForm && (
              <Button
                variant="outline"
                onClick={() => openAddressForm()}
                className="px-4"
              >
                <Plus className="h-4 w-4" /> Add address
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {addresses.map((address) => (
              <article key={address.id} className="card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist text-accent dark:bg-white/[0.06]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold">
                        {address.fullName}
                      </h3>
                      {address.isDefault && (
                        <span className="status-pill gap-1 bg-accent/10 text-accent">
                          <Check className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {address.phone}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {formatAddress(address)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => openAddressForm(address)}
                        className="px-2.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          onClick={() => makeDefault(address.id)}
                          disabled={busyAddressId === address.id}
                          className="px-2.5 text-xs text-accent"
                        >
                          <Check className="h-3.5 w-3.5" /> Make default
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        onClick={() => removeAddress(address.id)}
                        disabled={busyAddressId === address.id}
                        className="px-2.5 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {addresses.length === 0 && !showAddressForm && (
              <div className="card border-dashed p-8 text-center">
                <MapPin className="mx-auto h-7 w-7 text-gray-300" />
                <p className="mt-3 text-sm font-extrabold">
                  No saved addresses
                </p>
              </div>
            )}

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
          </div>
        </section>
      </div>
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="text-xs font-bold text-gray-500 hover:text-deal"
        >
          Delete my account
        </button>
      </div>
    </AccountShell>
  );
}

// Page title around the account page.
function AccountShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl pb-12 pt-6 sm:pt-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">My account</h1>
        {onLogout && (
          <Button variant="danger" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
