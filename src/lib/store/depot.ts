import { create } from "zustand";
import type { Role, Depot } from "../types";

interface CurrentDepot {
  isLoading: boolean;
  depot: Depot | null;
  setDepot: (depot: Depot | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useDepot = create<CurrentDepot>()((set) => ({
  isLoading: false,
  depot: null,
  setIsLoading: (isLoading) => set({ isLoading }),
  setDepot: (depot) => set({ depot }),
}));

interface RoleDepot {
  isLoading: boolean;
  role: Role | null;
  setRole: (role: Role | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useRole = create<RoleDepot>()((set) => ({
  isLoading: false,
  role: null,
  setIsLoading: (isLoading) => set({ isLoading }),
  setRole: (role) => set({ role }),
}));
