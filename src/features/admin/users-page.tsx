"use client";

import { useCallback, useState } from "react";
import { listUsers, setUserBlocked, setUserRole } from "@/api/admin";
import { errorMessage } from "@/api/http";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminTitle } from "@/features/admin/admin-shell";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { formatDate, phoneText } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import type { AdminUser } from "@/lib/types";

const ROLE_TEXT = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  USER: "Customer",
};

// Customers and admins: search by phone, block/unblock, make or remove admin.
export function AdminUsers() {
  const myRole = useAuthStore((state) => state.role);
  const myPhone = useAuthStore((state) => state.phone);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const phone = useDebouncedValue(search);

  // Loads one page of users for the typed phone digits.
  const loadUsers = useCallback(
    (cursor?: string) => listUsers(cursor, phone),
    [phone],
  );
  const {
    items,
    setItems,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  } = usePaginatedList<AdminUser>(loadUsers);

  // Whether this admin may change the user (not yourself, not the super admin, admins only by the super admin).
  function canManage(user: AdminUser) {
    if (user.phone === myPhone || user.role === "SUPER_ADMIN") return false;
    return user.role === "USER" || myRole === "SUPER_ADMIN";
  }

  // Blocks or unblocks a user after a confirm.
  async function toggleBlock(user: AdminUser) {
    const block = !user.isBlocked;
    if (
      !window.confirm(
        `${block ? "Block" : "Unblock"} ${phoneText(user.phone)}?`,
      )
    )
      return;
    setBusyId(user.id);
    try {
      await setUserBlocked(user.id, block);
      setItems((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isBlocked: block } : item,
        ),
      );
      toast.success(block ? "User blocked" : "User unblocked");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this user"));
    } finally {
      setBusyId("");
    }
  }

  // Makes a user an admin, or takes admin away, after a confirm.
  async function toggleAdmin(user: AdminUser) {
    const role = user.role === "ADMIN" ? "USER" : "ADMIN";
    const question =
      role === "ADMIN"
        ? `Make ${phoneText(user.phone)} an admin?`
        : `Remove admin access from ${phoneText(user.phone)}?`;
    if (!window.confirm(question)) return;
    setBusyId(user.id);
    try {
      await setUserRole(user.id, role);
      setItems((current) =>
        current.map((item) => (item.id === user.id ? { ...item, role } : item)),
      );
      toast.success("Role changed");
    } catch (error) {
      toast.error(errorMessage(error, "Could not change the role"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <AdminTitle title="Users" />
      <input
        type="search"
        inputMode="numeric"
        value={search}
        onChange={(event) =>
          setSearch(event.target.value.replace(/\D/g, "").slice(0, 10))
        }
        placeholder="Search mobile number"
        aria-label="Search mobile number"
        className="field max-w-md"
      />

      {loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="rounded-[20px] bg-white p-8 text-center font-semibold">
          No users found
        </p>
      ) : (
        <div className="table-box">
          <div className="min-w-[820px]">
            <div className="table-head">
              <span>Name</span>
              <span>Mobile</span>
              <span>Joined</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {items.map((user) => (
              <div key={user.id} className="data-row">
                <span className="font-semibold">
                  <span className="block truncate">
                    {user.name ?? "No name"}
                  </span>
                  <span className="block truncate text-sm font-normal text-muted">
                    {user.email ?? "No email"}
                  </span>
                </span>
                <span>{phoneText(user.phone)}</span>
                <span>{formatDate(user.createdAt)}</span>
                <span>{ROLE_TEXT[user.role]}</span>
                <span>
                  <StatusPill
                    tone={user.isBlocked ? "bad" : "good"}
                    label={user.isBlocked ? "Blocked" : "Active"}
                  />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {canManage(user) && (
                    <button
                      type="button"
                      onClick={() => toggleBlock(user)}
                      disabled={busyId === user.id}
                      className="btn-table"
                    >
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  )}
                  {canManage(user) && myRole === "SUPER_ADMIN" && (
                    <button
                      type="button"
                      onClick={() => toggleAdmin(user)}
                      disabled={busyId === user.id}
                      className="btn-table"
                    >
                      {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {cursor && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
    </>
  );
}
