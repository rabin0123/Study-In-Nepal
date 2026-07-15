import { useState, useCallback, useEffect } from "react";
import type { User } from "../lib/types";

interface Paginated<T> {
  data: T[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "Failed to load users.");
      }
      const data = (await res.json()) as Paginated<User> | User[];
      setUsers(Array.isArray(data) ? data : data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deactivate = useCallback(async (user: User) => {
    const res = await fetch(`/api/users/${user.id}/deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    });
    if (!res.ok) {
      // Protected users will 403 here — surface it, don't fail silently.
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not deactivate user.");
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u)));
  }, []);

  const activate = useCallback(async (user: User) => {
    const res = await fetch(`/api/users/${user.id}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not activate user.");
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: true } : u)));
  }, []);

  const destroy = useCallback(async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "DELETE",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not delete user.");
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }, []);

  const assignRoles = useCallback(async (user: User, roleNames: string[]) => {
    const res = await fetch(`/api/users/${user.id}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ roles: roleNames }),
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not update roles.");
    }
    const data = (await res.json()) as { roles: User["roles"] };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, roles: data.roles } : u)));
  }, []);

  return { users, loading, error, fetchUsers, deactivate, activate, destroy, assignRoles };
}
