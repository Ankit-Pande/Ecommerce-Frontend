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
import { Button } from "@/components/ui/button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { AddressForm, MAX_ADDRESSES } from "@/features/account/address-form";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatAddress, phoneText } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { Address, UserProfile } from "@/lib/types";

// Account page: profile form, logout, delete account and saved addresses.
export function AccountPage() {
  const { ready } = useAuthGuard();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!ready) return;
    setFailed(false);
    Promise.all([getProfile(), listAddresses()])
      .then(([user, saved]) => {
        setProfile(user);
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setAddresses(saved);
      })
      .catch(() => setFailed(true));
  }, [ready, reloadKey]);

  // Saves the name and email.
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await updateProfile({
        ...(name.trim() && { name: name.trim() }),
        ...(email.trim() && { email: email.trim() }),
      });
      setProfile(saved);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  }

  // Makes this address the default and reloads the list.
  async function makeDefault(id: string) {
    setBusyId(id);
    try {
      await updateAddress(id, { isDefault: true });
      setAddresses(await listAddresses());
      toast.success("Default address changed");
    } catch (error) {
      toast.error(errorMessage(error, "Could not change the default address"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes an address after a confirm and reloads the list.
  async function removeAddress(id: string) {
    if (!window.confirm("Delete this address?")) return;
    setBusyId(id);
    try {
      await deleteAddress(id);
      setAddresses(await listAddresses());
      toast.success("Address deleted");
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete this address"));
    } finally {
      setBusyId("");
    }
  }

  // Deletes the account after a confirm, then logs out.
  async function closeAccount() {
    if (!window.confirm("Delete your account? This cannot be undone.")) return;
    try {
      await deleteAccount();
      await logoutSession();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete your account"));
    }
  }

  let body: React.ReactNode;
  if (failed) {
    body = <OfflineNotice onRetry={() => setReloadKey((key) => key + 1)} />;
  } else if (!profile) {
    body = <ListSkeleton count={2} />;
  } else {
    const displayName = profile.name || "ApnaKart customer";
    body = (
      <div className="flex flex-wrap items-start gap-6">
        <form
          onSubmit={saveProfile}
          className="card flex flex-[1_1_300px] flex-col gap-3 p-5"
        >
          <div className="flex items-center gap-3.5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-[28px] font-extrabold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold">{displayName}</p>
              <p className="text-muted">{phoneText(profile.phone)}</p>
            </div>
          </div>
          <label className="label">
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
          <label className="label">
            Mobile number
            <input
              className="field bg-soft text-muted"
              readOnly
              value={phoneText(profile.phone)}
            />
          </label>
          <label className="label">
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
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
          <button
            type="button"
            onClick={() => void logoutSession()}
            className="btn-danger"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={closeAccount}
            className="btn-remove self-center"
          >
            Delete my account
          </button>
        </form>

        <section className="flex min-w-0 flex-[2_1_360px] flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Saved addresses</h2>
            {addresses.length < MAX_ADDRESSES && editing === null && (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="btn-primary min-h-11"
              >
                Add address
              </button>
            )}
          </div>

          {editing !== null && (
            <AddressForm
              key={editing === "new" ? "new" : editing.id}
              address={editing === "new" ? undefined : editing}
              onSaved={(saved) => {
                setAddresses((current) =>
                  editing === "new"
                    ? [...current, saved]
                    : current.map((address) =>
                        address.id === saved.id ? saved : address,
                      ),
                );
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}

          {addresses.length === 0 && editing === null && (
            <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
              No saved addresses
            </p>
          )}

          {addresses.map((address) => (
            <article
              key={address.id}
              className="flex flex-wrap items-center gap-3 rounded-[20px] bg-white p-4 shadow-card"
            >
              {address.isDefault && (
                <span className="rounded-full bg-ground px-3.5 py-1 font-extrabold">
                  Default
                </span>
              )}
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="font-semibold">
                  {address.fullName} · {phoneText(address.phone)}
                </p>
                <p className="text-muted">{formatAddress(address)}</p>
              </div>
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(address.id)}
                  disabled={busyId === address.id}
                  className="btn-line"
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(address)}
                className="btn-line"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeAddress(address.id)}
                disabled={busyId === address.id}
                className="btn-remove"
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
    <>
      <h1 className="page-title">My account</h1>
      {body}
    </>
  );
}
