import { useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useDepot, useRole } from "@/lib/store/depot";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import type { ListResponse, Role, Depot } from "@/lib/types";

const DepotContext = ({ children }: { children: ReactNode }) => {
  const { query } = useRouter();
  const { data: session, status } = useSession();
  const setDepot = useDepot((state) => state.setDepot);
  const setDepotLoading = useDepot((state) => state.setIsLoading);
  const setRole = useRole((state) => state.setRole);
  const setRolesLoading = useRole((state) => state.setIsLoading);
  const axios = useAxiosAuth();
  const { isLoading: depotLoading } = useQuery({
    queryKey: ["depot", query.depotId],
    queryFn: async () => {
      if (!query.depotId || typeof query.depotId !== "string") {
        return null;
      }
      const { data } = await axios.get<Depot>(`api/depots/${query.depotId}/`);
      return data;
    },
    onSuccess: (data) => {
      setDepot(data);
    },
  });
  const { isLoading: roleLoading } = useQuery({
    queryKey: ["role", session?.user.id, query.depotId],
    queryFn: async () => {
      if (!query.depotId || typeof query.depotId !== "string") {
        return null;
      }
      const { data } = await axios.get<ListResponse<Role>>(
        `api/roles/?depot=${query.depotId}`
      );
      return data.results[0] ?? null;
    },
    enabled: status === "authenticated",
    onSuccess: (data) => setRole(data),
  });

  useEffect(() => {
    setDepotLoading(depotLoading);
  }, [depotLoading, setDepotLoading]);

  useEffect(() => {
    setRolesLoading(roleLoading);
  }, [roleLoading, setRolesLoading]);

  return <>{children}</>;
};

export default DepotContext;
