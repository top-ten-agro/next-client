import { useReducer, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import Typography from "@mui/material/Typography";
import { useDepot, useRole } from "@/lib/store/depot";
import type { ListResponse, Product, Order, Customer } from "@/lib/types";
import { orderItemsReducer } from "@/lib/reducers/orderItems";
import OrderItemForm from "@/components/OrderItemForm";
import OrderItemsTable from "@/components/OrderItemsTable";

const AddOrder = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  const isRoleLoading = useRole((state) => state.isLoading);
  const [items, dispatch] = useReducer(orderItemsReducer, []);
  const [selectedBalance, setSelectedBalance] = useState<number>();
  const [commission, setCommission] = useState(0);

  type PartialBalance = { id: number; customer: Pick<Customer, "id" | "name"> };

  const { data: products } = useQuery({
    queryKey: ["products", router.query.depotId],
    queryFn: async () => {
      const { data } = await axios.get<ListResponse<Product>>(
        `api/products/?depots=${router.query.depotId as string}&per_page=999`
      );
      return data.results;
    },
    initialData: [] as Product[],
  });
  const { data: customers } = useQuery(
    ["entry-balances", router.query.depotId],
    async () => {
      const depotId = router.query.depotId as string;
      const { data } = await axios.get<PartialBalance[]>(
        `api/depots/${depotId}/customers/?expand=customer&fields=id,customer.id,customer.name`
      );
      return data;
    },
    { initialData: [] }
  );

  const { mutate: createOrder, isLoading: isCreatingStock } = useMutation({
    mutationKey: ["order", "create-order", depot?.id],
    mutationFn: async () => {
      if (!items.length) {
        throw new Error("No product selected.");
      }
      if (!selectedBalance) {
        throw new Error("No customer selected.");
      }
      const res = await axios.post(`api/orders/`, {
        items,
        depot: parseInt(router.query.depotId as string),
        balance: selectedBalance,
        commission,
        subtotal: 0,
      });
      return res.data as Order;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/depots/[depotId]/orders/[orderId]",
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

  return (
    <>
      <Head>
        <title>Add Order | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/depots/${router.query.depotId as string}/orders`}
          heading={`Add Order`}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${depot?.id ?? ""}`,
            },
            {
              name: "Orders",
              path: `/depots/${router.query.depotId as string}/orders`,
            },
            { name: `Add Order` },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "OFFICER" ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <Autocomplete
                sx={{ mb: 2 }}
                value={
                  customers?.find(({ id }) => id === selectedBalance) ?? null
                }
                options={customers}
                onChange={(_, data) => {
                  setSelectedBalance(data?.id);
                }}
                getOptionLabel={(option) => option.customer.name}
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

              <Divider sx={{ my: 2 }} />
              <OrderItemForm
                products={products}
                items={items}
                addItem={(item) => dispatch({ type: "ADD", payload: item })}
              />
            </Grid>
            <Grid xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <OrderItemsTable
                products={products}
                selected={items}
                commission={commission}
                removeItem={(id) => dispatch({ type: "REMOVE", payload: id })}
              />
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
                  aria-label="Comission"
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
            {"You don't have permission to create new order."}
          </Alert>
        )}
      </Container>
    </>
  );
};

export default AddOrder;
