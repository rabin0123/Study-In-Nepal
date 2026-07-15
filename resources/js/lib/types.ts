export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}

export type PermissionGroups = Record<string, Permission[]>;

export interface User {
  id: number;
  name: string;
  email: string;
  account_type: string;
  is_protected: boolean;
  is_active: boolean;
  roles?: Role[];
}

export interface ApiErrorBody {
  message?: string;
}
