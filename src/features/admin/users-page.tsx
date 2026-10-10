"use client";

import { useCallback, useState } from "react";
import { Search, Shield, ShieldOff, UserRound, UsersRound } from "lucide-react";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import { OfflineNotice } from "@/components/ui/offline-notice";
import { ListSkeleton } from "@/components/ui/skeletons";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { listUsers, setUserBlocked, setUserRole } from "@/api/admin";
import { errorMessage } from "@/api/http";
import type { AdminUser, UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/store/toast-store";
import { Button } from "@/components/ui/button";

// Pill colour for a role.
function roleStyle(role: UserRole) {
  if (role === "SUPER_ADMIN") {
    return "bg-purple-100 text-purple-700";
  }
  if (role === "ADMIN") {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-gray-100 text-gray-500";
}

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">Customer accounts</h2>

        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search phone number</span>
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value.replace(/\D/g, ""))
            }
            inputMode="numeric"
            placeholder="Search phone number"
            className="field pl-10"
          />
        </label>
      </div>

      <div className="mt-5">
        {loading ? (
          <ListSkeleton />
        ) : failed ? (
          <OfflineNotice onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-extrabold">No customers found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((user) => (
              <article
                key={user.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4 transition hover:border-accent/15 hover:shadow-card"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    user.isBlocked
                      ? "bg-discount/10 text-discount"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  <UserRound className="h-4 w-4" />
                </span>

                <div className="min-w-[180px] flex-1">
                  <h2 className="text-sm font-extrabold">
                    +91 {user.phone}
                    {user.name && (
                      <span className="font-semibold text-gray-400">
                        {" "}
                        - {user.name}
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {user.email ?? "No email"} - Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span className={`status-pill ${roleStyle(user.role)}`}>
                  {user.role.replace("_", " ")}
                </span>
                {user.isBlocked && (
                  <span className="status-pill bg-discount/10 text-discount">
                    Blocked
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {currentRole === "SUPER_ADMIN" &&
                    user.role !== "SUPER_ADMIN" && (
                      <Button
                        variant="ghost"
                        onClick={() => toggleAdmin(user)}
                        disabled={busyId === user.id}
                        className="px-2.5 text-xs text-accent"
                      >
                        {busyId === user.id ? (
                          <Spinner />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                        {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
                      </Button>
                    )}

                  {(user.role === "USER" ||
                    (currentRole === "SUPER_ADMIN" &&
                      user.role === "ADMIN")) && (
                    <button
                      type="button"
                      onClick={() => toggleBlock(user)}
                      disabled={busyId === user.id}
                      className={`btn-ghost px-2.5 text-xs ${
                        user.isBlocked
                          ? "text-accent"
                          : "text-discount hover:text-discount"
                      }`}
                    >
                      {busyId === user.id ? (
                        <Spinner />
                      ) : user.isBlocked ? (
                        <Shield className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5" />
                      )}
                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  )}
                </div>
              </article>
            ))}

            {cursor && (
              <div className="pt-3">
                <LoadMoreButton onClick={loadMore} loading={loadingMore} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
