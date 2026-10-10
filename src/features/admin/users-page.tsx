"use client";

import { useCallback, useState } from "react";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { StatusPill } from "@/components/ui/status-pill";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { listUsers, setUserBlocked, setUserRole } from "@/api/admin";
import { errorMessage } from "@/api/http";
import type { AdminUser } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import { formatDate } from "@/lib/format";

const ROLE_TEXT = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  USER: "Customer",
};

// Customer list with block and role actions.
export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const currentRole = useAuthStore((state) => state.role);
  const term = useDebouncedValue(search);

  const loadUsers = useCallback(
    (cursor?: string) => listUsers(cursor, term.trim()),
    [term],
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

  // Blocks or unblocks a user.
  async function toggleBlock(user: AdminUser) {
    const willBlock = !user.isBlocked;
    const action = willBlock ? "Block" : "Unblock";
    if (!window.confirm(`${action} +91 ${user.phone}?`)) return;

    setBusyId(user.id);
    try {
      await setUserBlocked(user.id, willBlock);
      setItems((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isBlocked: willBlock } : item,
        ),
      );
      toast.success(willBlock ? "Customer blocked" : "Customer unblocked");
    } catch (error) {
      toast.error(
        errorMessage(error, `Could not ${action.toLowerCase()} this customer`),
      );
    } finally {
      setBusyId("");
    }
  }

  // Makes a user admin or customer.
  async function toggleAdmin(user: AdminUser) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const action = nextRole === "ADMIN" ? "Grant" : "Remove";
    if (!window.confirm(`${action} admin access for +91 ${user.phone}?`))
      return;

    setBusyId(user.id);
    try {
      await setUserRole(user.id, nextRole);
      setItems((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, role: nextRole } : item,
        ),
      );
      toast.success("Customer role updated");
    } catch (error) {
      toast.error(errorMessage(error, "Could not update this customer role"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder="Search phone number"
        aria-label="Search phone number"
        className="field max-w-sm"
      />

      {loading ? (
        <ListSkeleton />
      ) : failed ? (
        <OfflineNotice onRetry={reload} />
      ) : items.length === 0 ? (
        <p className="card p-8 text-center font-semibold">No users found</p>
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
                <span className="truncate font-semibold">
                  {user.name ?? "No name"}
                  <span className="block truncate text-sm font-normal text-muted">
                    {user.email ?? "No email"}
                  </span>
                </span>
                <span>+91 {user.phone}</span>
                <span>{formatDate(user.createdAt)}</span>
                <span>{ROLE_TEXT[user.role]}</span>
                <span>
                  <StatusPill
                    tone={user.isBlocked ? "red" : "green"}
                    label={user.isBlocked ? "Blocked" : "Active"}
                  />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {(user.role === "USER" ||
                    (currentRole === "SUPER_ADMIN" &&
                      user.role === "ADMIN")) && (
                    <button
                      type="button"
                      onClick={() => toggleBlock(user)}
                      disabled={busyId === user.id}
                      className="btn-table"
                    >
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  )}
                  {currentRole === "SUPER_ADMIN" &&
                    user.role !== "SUPER_ADMIN" && (
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
    </div>
  );
}
