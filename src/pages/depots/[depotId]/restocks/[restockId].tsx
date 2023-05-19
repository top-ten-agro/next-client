import { useMemo, useReducer } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Unstable_Grid2";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useDepot, useRole } from "@/lib/store/depot";
import type { ListResponse, Product, ReStock } from "@/lib/types";
import dayjs from "dayjs";
import Typography from "@mui/material/Typography";
import { AxiosError } from "axios";
import RestockItemsTable from "@/components/RestockItemsTable";
import RestockItemForm from "@/components/RestockItemForm";
import { restockItemsReducer } from "@/lib/reducers/restockItems";

const RestockPage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  const [items, dispatch] = useReducer(restockItemsReducer, []);

  const { data: products } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Product>>(
        "api/products/?per_page=999"
      );
      return data.results;
    },
    initialData: [] as Product[],
  });

  const {
    data: restock,
    isLoading,
    refetch: refetchRestock,
  } = useQuery({
    queryKey: ["restock", "fetch-restock", router.query.restockId],
    queryFn: async () => {
      if (typeof router.query.restockId !== "string") {
        return undefined;
      }
      const { data } = await axios.get<ReStock>(
        `api/restocks/${router.query.restockId}/?expand=created_by`
      );
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      if (data.items) {
        dispatch({ type: "SET", payload: data.items });
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });
  const { mutate: updateRestock, isLoading: isUpdatingStock } = useMutation({
    mutationKey: ["restock", "update-restock", depot?.id],
    mutationFn: async () => {
      if (!restock) return;
      if (restock.approved) {
        throw new Error("Approved Restock cannot be updatetd.");
      }
      if (!items.length) {
        throw new Error("No product selected.");
      }
      const res = await axios.put(`api/restocks/${restock.id}/`, {
        items,
        depot: restock.depot,
      });
      return res.data as ReStock;
    },
    onSuccess: (data) => {
      if (!data) return;
      void refetchRestock();
      toast.success("Update successful.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });
  const { mutate: deleteRestock, isLoading: isDeletingRestock } = useMutation({
    mutationKey: ["delete-restock", restock?.id],
    mutationFn: async () => {
      if (!restock) {
        throw new Error("Restock object not found.");
      }
      const confirmed = confirm(`Delete Restock #${restock.id}?`);
      if (!confirmed) {
        throw new Error("Process cancelled.");
      }
      await axios.delete(`api/restocks/${restock.id}/remove/`);
    },
    onSuccess: () => {
      void router.push({
        pathname: "/depots/[depotId]/restocks",
        query: { ...router.query },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });
  const { mutate: approveRestock, isLoading: isApproving } = useMutation({
    mutationKey: ["restock", "approve-restock", restock?.id],
    mutationFn: async () => {
      if (!restock) {
        throw new Error("Restock object not found.");
      }
      const confirmed = confirm(`Approve Restock #${restock.id}?`);
      if (!confirmed) {
        throw new Error("Process cancelled.");
      }
      await axios.put(`api/restocks/${restock.id}/approve/`);
    },
    onSuccess: () => {
      toast.success("Restock approved.");
      void refetchRestock();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve."
      );
    },
  });

  const permissions = useMemo(
    () => ({
      canUpdate:
        restock?.approved === false &&
        (role?.role === "DIRECTOR" ||
          (role?.role === "MANAGER" && restock?.created_by.id === role.user)),
      canApprove: restock?.approved === false && role?.role === "DIRECTOR",
      canDelete:
        role?.role === "DIRECTOR" ||
        (restock?.approved === false &&
          role?.role === "MANAGER" &&
          restock?.created_by.id === role.user),
    }),
    [restock?.approved, restock?.created_by.id, role?.role, role?.user]
  );

  return (
    <>
      <Head>
        <title>Re-Stock #{restock?.id} | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/depots/${router.query.depotId as string}/restocks`}
          heading={`ReStock #${restock?.id ?? ""}`}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${depot?.id ?? ""}`,
            },
            {
              name: "Re-Stocks",
              path: `/depots/${router.query.depotId as string}/restocks`,
            },
            { name: `ReStock #${restock?.id ?? ""}` },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <List dense sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={"Created at"}
                    secondary={dayjs(restock?.created_at).format(
                      "DD/MM/YYYY HH:mm A"
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created by"}
                    secondary={restock?.created_by.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Approved"}
                    secondary={restock?.approved ? "Yes" : "No"}
                  />
                </ListItem>
              </List>
              {permissions.canUpdate ? (
                <RestockItemForm
                  products={products}
                  items={items}
                  addItem={(item) => dispatch({ type: "ADD", payload: item })}
                />
              ) : null}
            </Grid>
            <Grid xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <RestockItemsTable
                products={products}
                selected={items}
                immutable={!permissions.canUpdate}
                removeItem={(id) => dispatch({ type: "REMOVE", payload: id })}
              />

              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 2,
                  flexDirection: "row-reverse",
                }}
              >
                {permissions.canUpdate ? (
                  <LoadingButton
                    variant="contained"
                    loading={isUpdatingStock}
                    disabled={
                      JSON.stringify(restock?.items) === JSON.stringify(items)
                    }
                    onClick={() => updateRestock()}
                  >
                    Update
                  </LoadingButton>
                ) : null}
                {permissions.canDelete ? (
                  <LoadingButton
                    variant="text"
                    color="error"
                    loading={isDeletingRestock}
                    onClick={() => deleteRestock()}
                  >
                    Delete
                  </LoadingButton>
                ) : null}

                {permissions.canApprove ? (
                  <LoadingButton
                    variant="contained"
                    loading={isApproving}
                    onClick={() => approveRestock()}
                    disabled={
                      JSON.stringify(restock?.items) !== JSON.stringify(items)
                    }
                    sx={{ mr: "auto" }}
                  >
                    Approve
                  </LoadingButton>
                ) : null}
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default RestockPage;
