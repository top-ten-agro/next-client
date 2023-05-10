import React, { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { z } from "zod";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import DeleteIcon from "@mui/icons-material/Delete";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type { ListResponse, Product, ReStock } from "@/lib/types";
import dayjs from "dayjs";
import Typography from "@mui/material/Typography";
import { AxiosError } from "axios";

const schema = z.object({
  product: z.number().int(),
  quantity: z.number().int().min(1),
});

const RestockPage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const [selectedProducts, setSelectedProducts] = useState<
    z.infer<typeof schema>[]
  >([]);
  const {
    control,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });
  const { data: products, isFetching } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Product>>("api/products/");
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
        setSelectedProducts([...data.items]);
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });
  const { mutate: updateRestock, isLoading: isUpdatingStock } = useMutation({
    mutationKey: ["restock", "update-restock", store?.id],
    mutationFn: async () => {
      if (!restock) return;
      if (restock.approved) {
        throw new Error("Approved Restock cannot be updatetd.");
      }
      if (!selectedProducts.length) {
        throw new Error("No product selected.");
      }
      const res = await axios.put(`api/restocks/${restock.id}/`, {
        items: selectedProducts,
        store: restock.store,
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
        pathname: "/stores/[storeId]/restocks",
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
    }),
    [restock?.approved, restock?.created_by.id, role?.role, role?.user]
  );

  const selectProduct = handleSubmit((data) => {
    reset();
    setSelectedProducts((val) => [
      ...val.filter((item) => item.product !== data.product),
      data,
    ]);
  });
  return (
    <>
      <Head>
        <title>Re-Stock #{restock?.id} | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/restocks`}
          heading={`ReStock #${restock?.id ?? ""}`}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${store?.id ?? ""}`,
            },
            {
              name: "Re-Stocks",
              path: `/stores/${router.query.storeId as string}/restocks`,
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
                <Box component="form" onSubmit={(e) => void selectProduct(e)}>
                  <Grid container spacing={2}>
                    <Grid xs={12}>
                      <Controller
                        render={({ field: { onChange, value, ...field } }) => (
                          <Autocomplete
                            {...field}
                            disabled={isFetching}
                            value={
                              products?.find(({ id }) => id === value) ?? null
                            }
                            options={products}
                            onChange={(_, data) => onChange(data?.id)}
                            getOptionLabel={(option) => option.name}
                            groupBy={(option) => option.group_name}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Product"
                                placeholder="Select a Product"
                                InputLabelProps={{
                                  shrink: true,
                                }}
                                error={!!errors.product}
                                helperText={errors.product?.message}
                              />
                            )}
                          />
                        )}
                        name="product"
                        control={control}
                      />
                    </Grid>
                    <Grid xs={12}>
                      <Controller
                        name="quantity"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            onChange={(e) => field.onChange(+e.target.value)}
                            label="Quantity"
                            type="number"
                            inputProps={{ min: 1 }}
                            error={!!errors.quantity}
                            helperText={errors.quantity?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid xs={12} sx={{ textAlign: "right" }}>
                      <Button type="submit" variant="text">
                        Add Quantity
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}
            </Grid>
            <Grid xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <ProductsTable
                products={products}
                selected={selectedProducts}
                immutable={!permissions.canUpdate}
                removeFromList={(id) =>
                  setSelectedProducts((data) =>
                    data.filter((item) => item.product !== id)
                  )
                }
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
                  <>
                    <LoadingButton
                      variant="contained"
                      loading={isUpdatingStock}
                      disabled={
                        JSON.stringify(restock?.items) ===
                        JSON.stringify(selectedProducts)
                      }
                      onClick={() => updateRestock()}
                    >
                      Update
                    </LoadingButton>
                    <LoadingButton
                      variant="text"
                      color="error"
                      loading={isDeletingRestock}
                      onClick={() => deleteRestock()}
                    >
                      Delete
                    </LoadingButton>
                  </>
                ) : null}

                {permissions.canApprove ? (
                  <LoadingButton
                    variant="contained"
                    loading={isApproving}
                    onClick={() => approveRestock()}
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

const ProductsTable = ({
  selected,
  products,
  removeFromList,
  immutable,
}: {
  products: Product[];
  selected: z.infer<typeof schema>[];
  removeFromList: (id: number) => void;
  immutable?: boolean;
}) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="products table">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="center">Quantity</TableCell>
            {immutable ? null : <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {selected.map((row, i) => (
            <TableRow
              key={row.product}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {i + 1}
              </TableCell>
              <TableCell component="th" scope="row">
                {products.find(({ id }) => id === row.product)?.name}
              </TableCell>
              <TableCell align="center">{row.quantity}</TableCell>
              {immutable ? null : (
                <TableCell align="center">
                  <IconButton
                    size="small"
                    aria-label="remove from list"
                    onClick={() => removeFromList(row.product)}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          {selected.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center", py: 2 }}>
                no product selected.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
