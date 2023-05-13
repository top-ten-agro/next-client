import { useMemo, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { z } from "zod";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { AxiosError } from "axios";
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
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DeleteIcon from "@mui/icons-material/Delete";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import Typography from "@mui/material/Typography";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type { ListResponse, Product, Order } from "@/lib/types";
import { toBdt } from "@/lib/formatter";

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
  const [selectedProducts, setSelectedProducts] = useState<
    z.infer<typeof schema>[]
  >([]);
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

  const {
    data: order,
    isLoading,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ["order", "fetch-order", router.query.orderId],
    queryFn: async () => {
      if (typeof router.query.orderId !== "string") {
        return undefined;
      }
      const { data } = await axios.get<Order>(
        `api/orders/${router.query.orderId}/?expand=created_by,customer`
      );
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      if (data.items) {
        setSelectedProducts([
          ...data.items.map((item) => ({ ...item, rate: Number(item.rate) })),
        ]);
      }
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });
  const { mutate: updateOrder, isLoading: isUpdatingStock } = useMutation({
    mutationKey: ["order", "update-order", store?.id],
    mutationFn: async () => {
      if (!order) return;
      if (order.approved) {
        throw new Error("Approved Order cannot be updatetd.");
      }
      if (!selectedProducts.length) {
        throw new Error("No product selected.");
      }
      const res = await axios.put(`api/orders/${order.id}/`, {
        items: selectedProducts,
        store: order.store,
        customer: order.customer.id,
        amount: order.amount,
      });
      return res.data as Order;
    },
    onSuccess: (data) => {
      if (!data) return;
      void refetchOrder();
      toast.success("Update successful.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update.");
    },
  });
  const { mutate: deleteOrder, isLoading: isDeletingOrder } = useMutation({
    mutationKey: ["delete-order", order?.id],
    mutationFn: async () => {
      if (!order) {
        throw new Error("Order object not found.");
      }
      const confirmed = confirm(`Delete Order #${order.id}?`);
      if (!confirmed) {
        throw new Error("Process cancelled.");
      }
      await axios.delete(`api/orders/${order.id}/remove/`);
    },
    onSuccess: () => {
      void router.push({
        pathname: "/stores/[storeId]/orders",
        query: { ...router.query },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });
  const { mutate: approveOrder, isLoading: isApproving } = useMutation({
    mutationKey: ["order", "approve-order", order?.id],
    mutationFn: async () => {
      if (!order) {
        throw new Error("Order object not found.");
      }
      const confirmed = confirm(`Approve Order #${order.id}?`);
      if (!confirmed) {
        throw new Error("Process cancelled.");
      }
      await axios.put(`api/orders/${order.id}/approve/`);
    },
    onSuccess: () => {
      toast.success("Order approved.");
      void refetchOrder();
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
        order?.approved === false &&
        (role?.role === "MANAGER" ||
          (role?.role === "OFFICER" && order?.created_by.id === role.user)),
      canDelete:
        role?.role === "MANAGER" ||
        (order?.approved === false &&
          role?.role === "OFFICER" &&
          order?.created_by.id === role.user),
      canApprove: order?.approved === false && role?.role === "MANAGER",
    }),
    [order?.approved, order?.created_by.id, role?.role, role?.user]
  );

  const notUpdated = useMemo(
    () =>
      JSON.stringify(
        order?.items.map((item) => ({
          ...item,
          rate: Number(item.rate),
        }))
      ) === JSON.stringify(selectedProducts),
    [order, selectedProducts]
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
        <title>Order #{order?.id} | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/orders`}
          heading={`Order #${order?.id ?? ""}`}
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
            { name: `Order #${order?.id ?? ""}` },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <List dense sx={{ mb: 2 }}>
                <ListItem sx={{ p: 0 }}>
                  <ListItemButton
                    LinkComponent={NextLink}
                    href={`/stores/${
                      router.query.storeId as string
                    }/customers/${order?.customer.id ?? ""}`}
                  >
                    <ListItemText
                      primary={"Customer"}
                      secondary={order?.customer.name}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created at"}
                    secondary={dayjs(order?.created_at).format(
                      "DD/MM/YYYY HH:mm A"
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created by"}
                    secondary={order?.created_by.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Approved"}
                    secondary={order?.approved ? "Yes" : "No"}
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
                            error={!!errors.rate}
                            helperText={errors.rate?.message}
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
                  <LoadingButton
                    variant="contained"
                    loading={isUpdatingStock}
                    disabled={notUpdated}
                    onClick={() => updateOrder()}
                  >
                    Update
                  </LoadingButton>
                ) : null}
                {permissions.canDelete ? (
                  <LoadingButton
                    variant="text"
                    color="error"
                    loading={isDeletingOrder}
                    onClick={() => deleteOrder()}
                  >
                    Delete
                  </LoadingButton>
                ) : null}

                {permissions.canApprove ? (
                  <LoadingButton
                    variant="contained"
                    loading={isApproving}
                    onClick={() => approveOrder()}
                    sx={{ mr: "auto" }}
                    disabled={!notUpdated}
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
              <TableCell align="right">{toBdt(row.rate)}</TableCell>
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
          ) : null}{" "}
          <TableRow>
            <TableCell colSpan={2} />
            <TableCell align="right">Order Total</TableCell>
            <TableCell align="right">
              {toBdt(
                selected.reduce((acc, crr) => acc + crr.rate * crr.quantity, 0)
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
