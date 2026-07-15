import { useState, useCallback, useEffect } from "react";
import type { Role, PermissionGroups } from "../lib/types";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroups>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/roles", { headers: { Accept: "application/json" } }),
        fetch("/api/permissions", { headers: { Accept: "application/json" } }),
      ]);
      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error("Failed to load roles/permissions.");
      }
      setRoles((await rolesRes.json()) as Role[]);
      setPermissionGroups((await permsRes.json()) as PermissionGroups);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles/permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createRole = useCallback(async (name: string, permissions: string[] = []) => {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ name, permissions }),
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not create role.");
    }
    const data = (await res.json()) as Role;
    setRoles((prev) => [...prev, data]);
    return data;
  }, []);

  const updateRolePermissions = useCallback(async (role: Role, permissions: string[]) => {
    if (role.name === "developer") {
      // Client-side guard mirroring the backend's rule — developer is always full access.
      throw new Error("The developer role cannot be edited; it always has every permission.");
    }
    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not update role.");
    }
    const data = (await res.json()) as Role;
    setRoles((prev) => prev.map((r) => (r.id === role.id ? data : r)));
    return data;
  }, []);

  const deleteRole = useCallback(async (role: Role) => {
    if (["developer", "main-agent"].includes(role.name)) {
      throw new Error("This role cannot be deleted.");
    }
    const res = await fetch(`/api/roles/${role.id}`, {
      method: "DELETE",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (!res.ok) {
      const d = (await res.json()) as { message?: string };
      throw new Error(d.message ?? "Could not delete role.");
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  }, []);

  return { roles, permissionGroups, loading, error, fetchAll, createRole, updateRolePermissions, deleteRole };
}
