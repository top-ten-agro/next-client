import { create } from "zustand";
import type { Role, Store } from "../types";

interface CurrentStore {
  isLoading: boolean;
  store: Store | null;
  setStore: (store: Store | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useCurrentStore = create<CurrentStore>()((set) => ({
  isLoading: false,
  store: null,
  setIsLoading: (isLoading) => set({ isLoading }),
  setStore: (store) => set({ store }),
}));

interface RoleStore {
  isLoading: boolean;
  role: Role | null;
  setRole: (role: Role | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useStoreRole = create<RoleStore>()((set) => ({
  isLoading: false,
  role: null,
  setIsLoading: (isLoading) => set({ isLoading }),
  setRole: (role) => set({ role }),
}));
