import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { z } from "zod";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Alert from "@mui/material/Alert";
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
import DeleteIcon from "@mui/icons-material/Delete";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import Typography from "@mui/material/Typography";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type { ListResponse, Product, Order, Customer } from "@/lib/types";

const schema = z.object({
  product: z.number().int(),
  quantity: z.number().int().min(1),
  rate: z.number().min(0),
});

const OrderPage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const isRoleLoading = useStoreRole((state) => state.isLoading);
  const [selectedProducts, setSelectedProducts] = useState<
    z.infer<typeof schema>[]
  >([]);
  const [selectedCustomer, setselectedCustomer] = useState<number>();
  const {
    control,
    formState: { errors },
    reset,
    setValue,
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, rate: 0 },
  });
  const { data: products, isFetching } = useQuery({
    queryKey: ["products", router.query.storeId],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Product>>(
        `api/products/?stores=${router.query.storeId as string}`
      );
      return data.results;
    },
    initialData: [] as Product[],
  });
  const { data: customers, isFetching: isFetchingCustomers } = useQuery({
    queryKey: ["customers", router.query.storeId],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Customer>>(
        `api/customers/?stores=${router.query.storeId as string}`
      );
      return data.results;
    },
    initialData: [] as Customer[],
  });

  const { mutate: createOrder, isLoading: isCreatingStock } = useMutation({
    mutationKey: ["order", "create-order", store?.id],
    mutationFn: async () => {
      if (!selectedProducts.length) {
        throw new Error("No product selected.");
      }
      if (!selectedCustomer) {
        throw new Error("No customer selected.");
      }
      const res = await axios.post(`api/orders/`, {
        items: selectedProducts,
        store: parseInt(router.query.storeId as string),
        customer: selectedCustomer,
        amount: 0,
      });
      return res.data as Order;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/stores/[storeId]/orders/[orderId]",
        query: {
          ...router.query,
          orderId: data.id,
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });

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
        <title>Add Order | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/orders`}
          heading={`Add Order`}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${store?.id ?? ""}`,
            },
            {
              name: "Orders",
              path: `/stores/${router.query.storeId as string}/orders`,
            },
            { name: `Add Order` },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "OFFICER" ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <Box component="form" onSubmit={(e) => void selectProduct(e)}>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <Autocomplete
                      disabled={isFetchingCustomers}
                      sx={{ mb: 2 }}
                      value={
                        customers?.find(({ id }) => id === selectedCustomer) ??
                        null
                      }
                      options={customers}
                      onChange={(_, data) => {
                        setselectedCustomer(data?.id);
                      }}
                      getOptionLabel={(option) => option.name}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          placeholder="Select a Customer"
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      )}
                    />
                  </Grid>
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
                          onChange={(_, data) => {
                            setValue("rate", data ? Number(data.price) : 0);
                            onChange(data?.id);
                          }}
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
                  <Grid xs={6}>
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
                  <Grid xs={6}>
                    <Controller
                      name="rate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          onChange={(e) => field.onChange(+e.target.value)}
                          label="Rate"
                          type="number"
                          inputProps={{ min: 0 }}
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={12} sx={{ textAlign: "right" }}>
                    <Button type="submit" variant="text">
                      Add Product
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <ProductsTable
                products={products}
                selected={selectedProducts}
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
                <LoadingButton
                  variant="contained"
                  loading={isCreatingStock}
                  onClick={() => createOrder()}
                >
                  Save Order
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

export default OrderPage;

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
            <TableCell align="right">Rate</TableCell>
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
              <TableCell align="right">{row.rate}</TableCell>
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
              <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                no product selected.
              </TableCell>
            </TableRow>
          ) : null}
          <TableRow>
            <TableCell colSpan={2} />
            <TableCell align="right">Order Total</TableCell>
            <TableCell align="right">
              {selected.reduce((acc, crr) => acc + crr.rate * crr.quantity, 0)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
