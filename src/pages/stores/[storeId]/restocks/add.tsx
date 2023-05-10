import React, { useState } from "react";
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
import Alert from "@mui/material/Alert";
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
import DeleteIcon from "@mui/icons-material/Delete";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type { ListResponse, Product, ReStock } from "@/lib/types";

const schema = z.object({
  product: z.number().int(),
  quantity: z.number().int().min(1),
});

const AddReStock = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const isRoleLoading = useStoreRole((state) => state.isLoading);
  const [selectedProducts, setSelectedProducts] = useState<
    z.infer<typeof schema>[]
  >([]);
  const { data: products, isFetching } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Product>>("api/products/");
      return data.results;
    },
    initialData: [] as Product[],
  });

  const {
    control,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const selectProduct = handleSubmit((data) => {
    reset();
    setSelectedProducts((val) => [
      ...val.filter((item) => item.product !== data.product),
      data,
    ]);
  });

  const { mutate: createRestock, isLoading } = useMutation({
    mutationKey: ["new-restock", store?.id],
    mutationFn: async () => {
      if (!store?.id) return;
      if (!selectedProducts.length) {
        throw new Error("No product selected.");
      }
      const { data } = await axios.post<ReStock>("api/restocks/", {
        items: selectedProducts,
        store: store?.id,
      });
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/stores/[storeId]/restocks/[restockId]",
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
          backHref={`/stores/${router.query.storeId as string}/restocks`}
          heading="New Re-Stock"
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
            { name: "Add" },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "MANAGER" ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
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
            </Grid>
            <Grid xs={12} md={7}>
              <ProductsTable
                products={products}
                selected={selectedProducts}
                removeFromList={(id) =>
                  setSelectedProducts((data) =>
                    data.filter((item) => item.product !== id)
                  )
                }
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

const ProductsTable = ({
  selected,
  products,
  removeFromList,
}: {
  products: Product[];
  selected: z.infer<typeof schema>[];
  removeFromList: (id: number) => void;
}) => (
  <TableContainer component={Paper}>
    <Table size="small" aria-label="products table">
      <TableHead>
        <TableRow>
          <TableCell>#</TableCell>
          <TableCell>Name</TableCell>
          <TableCell align="center">Quantity</TableCell>
          <TableCell align="center">Actions</TableCell>
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

            <TableCell align="center">
              <IconButton
                size="small"
                aria-label="remove from list"
                onClick={() => removeFromList(row.product)}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </TableCell>
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
