import { useMemo, useReducer, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Grid from "@mui/material/Unstable_Grid2";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import Typography from "@mui/material/Typography";
import { orderItemsReducer } from "@/lib/reducers/orderItems";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type {
  ListResponse,
  Product,
  Order,
  CustomerBalance,
} from "@/lib/types";
import OrderItemForm from "@/components/OrderItemForm";
import OrderItemsTable from "@/components/OrderItemsTable";

const OrderPage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const [items, dispatch] = useReducer(orderItemsReducer, []);
  const [commission, setCommission] = useState(0);

  const { data: products } = useQuery({
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
        throw new Error("Order ID not defined.");
      }
      const { data } = await axios.get<Order>(
        `api/orders/${router.query.orderId}/?expand=created_by,customer`
      );

      return data;
    },
    onSuccess: ({ items, commission }) => {
      if (!items) return;
      if (items) {
        dispatch({
          type: "SET",
          payload: [...items.map((item) => ({ ...item, rate: +item.rate }))],
        });
      }
      setCommission(+commission);
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });
  const { data: balance } = useQuery({
    queryKey: ["balance", router.query.storeId, order?.customer.id],
    queryFn: async () => {
      if (typeof router.query.storeId !== "string" || !order) {
        throw new Error("Not enough data");
      }
      const { data } = await axios.get<ListResponse<CustomerBalance>>(
        `api/balances/?store=${router.query.storeId}&customer=${order.customer.id}`
      );
      return data.results[0];
    },
    enabled: !!order,
  });
  const { mutate: updateOrder, isLoading: isUpdatingStock } = useMutation({
    mutationKey: ["order", "update-order", store?.id],
    mutationFn: async () => {
      if (!order) return;
      if (order.approved) {
        throw new Error("Approved Order cannot be updatetd.");
      }
      if (!items.length) {
        throw new Error("No product selected.");
      }
      const res = await axios.put(`api/orders/${order.id}/`, {
        items,
        store: order.store,
        customer: order.customer.id,
        commission,
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
      ) === JSON.stringify(items) && commission === +(order?.commission ?? 0),
    [order, items, commission]
  );

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
                    }/customers/${balance?.id ?? ""}`}
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
                <OrderItemForm
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
              <OrderItemsTable
                products={products}
                selected={items}
                commission={
                  permissions.canUpdate ? commission : +(order?.commission ?? 0)
                }
                immutable={!permissions.canUpdate}
                removeItem={(id) => dispatch({ type: "REMOVE", payload: id })}
              />
              {permissions.canUpdate ? (
                <Box
                  sx={{
                    py: 2,
                    display: "flex",
                    justifyContent: "right",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Typography>Commission:</Typography>
                  <TextField
                    aria-label="Commission"
                    type="number"
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    sx={{ maxWidth: 160 }}
                    inputProps={{
                      min: 0,
                      max: 100,
                      style: { textAlign: "right" },
                    }}
                    value={commission}
                    onChange={(e) => setCommission(+e.target.value)}
                  />
                </Box>
              ) : null}
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
