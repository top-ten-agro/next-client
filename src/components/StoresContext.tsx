import { useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import type { ListResponse, Role, Store } from "@/lib/types";

const StoresContext = ({ children }: { children: ReactNode }) => {
  const { query } = useRouter();
  const { data: session, status } = useSession();
  const setStore = useCurrentStore((state) => state.setStore);
  const setStoreLoading = useCurrentStore((state) => state.setIsLoading);
  const setRole = useStoreRole((state) => state.setRole);
  const setRolesLoading = useStoreRole((state) => state.setIsLoading);
  const axios = useAxiosAuth();
  const { isLoading: storeLoading } = useQuery({
    queryKey: ["store", query.storeId],
    queryFn: async () => {
      if (!query.storeId || typeof query.storeId !== "string") {
        return null;
      }
      const { data } = await axios.get<Store>(`api/stores/${query.storeId}/`);
      return data;
    },
    onSuccess: (data) => {
      setStore(data);
    },
  });
  const { isLoading: roleLoading } = useQuery({
    queryKey: ["role", session?.user.id, query.storeId],
    queryFn: async () => {
      if (!query.storeId || typeof query.storeId !== "string") {
        return null;
      }
      const { data } = await axios.get<ListResponse<Role>>(
        `api/roles/?store=${query.storeId}`
      );
      return data.results[0] ?? null;
    },
    enabled: status === "authenticated",
    onSuccess: (data) => setRole(data),
  });

  useEffect(() => {
    setStoreLoading(storeLoading);
  }, [storeLoading, setStoreLoading]);

  useEffect(() => {
    setRolesLoading(roleLoading);
  }, [roleLoading, setRolesLoading]);

  return <>{children}</>;
};

export default StoresContext;
