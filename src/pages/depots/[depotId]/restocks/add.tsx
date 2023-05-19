import React, { useReducer } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Unstable_Grid2";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useDepot, useRole } from "@/lib/store/depot";
import type { ListResponse, Product, ReStock } from "@/lib/types";
import { restockItemsReducer } from "@/lib/reducers/restockItems";
import RestockItemForm from "@/components/RestockItemForm";
import RestockItemsTable from "@/components/RestockItemsTable";

const AddReStock = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  const isRoleLoading = useRole((state) => state.isLoading);
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

  const { mutate: createRestock, isLoading } = useMutation({
    mutationKey: ["new-restock", depot?.id],
    mutationFn: async () => {
      if (!depot?.id) return;
      if (!items.length) {
        throw new Error("No product selected.");
      }
      const { data } = await axios.post<ReStock>("api/restocks/", {
        items,
        depot: depot?.id,
      });
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/depots/[depotId]/restocks/[restockId]",
        query: {
          ...router.query,
          restockId: data.id,
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });

  return (
    <>
      <Head>
        <title>Add Re-Stock | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/depots/${router.query.depotId as string}/restocks`}
          heading="New Re-Stock"
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
            { name: "Add" },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "MANAGER" ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <RestockItemForm
                products={products}
                items={items}
                addItem={(item) => dispatch({ type: "ADD", payload: item })}
              />
            </Grid>
            <Grid xs={12} md={7}>
              <RestockItemsTable
                products={products}
                selected={items}
                removeItem={(id) => dispatch({ type: "REMOVE", payload: id })}
              />
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <LoadingButton
                  variant="contained"
                  loading={isLoading}
                  onClick={() => createRestock()}
                >
                  Save Re-Stock
                </LoadingButton>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="error">
            {"You don't have permission to add Re-Stock"}
          </Alert>
        )}
      </Container>
    </>
  );
};

export default AddReStock;
