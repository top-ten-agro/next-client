import { create } from "zustand";
import type { Role } from "../types";

interface RoleStore {
  roles: Role[];
  get: (storeId?: number) => Role | undefined;
  setRoles: (roles: Role[]) => void;
}

export const useRoleStore = create<RoleStore>()((set, get) => ({
  roles: [],
  get: (storeId) => get().roles.find((role) => role.store === storeId),
  setRoles: (roles) => set({ roles }),
}));
