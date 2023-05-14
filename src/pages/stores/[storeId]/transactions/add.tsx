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
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import type { ListResponse, Transaction, Customer } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  category: z.enum(["SALES", "TRANSPORT", "BILL"]),
  note: z.string().optional(),
  customer: z.number().int().optional(),
  amount: z.number().min(1, "Amount is too small."),
});

const AddTransaction = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const isRoleLoading = useStoreRole((state) => state.isLoading);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "IN",
      category: "SALES",
      amount: 0,
      title: "",
      note: "",
    },
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

  const { mutate: submitTrx, isLoading: isCreatingStock } = useMutation({
    mutationKey: ["transaction", "create-transaction", router.query.storeId],
    mutationFn: async (props: z.infer<typeof schema>) => {
      const res = await axios.post(`api/transactions/`, {
        store: parseInt(router.query.storeId as string),
        title: props.title,
        category: props.category,
        customer: props.customer,
        cash_in: props.type === "IN" ? props.amount : 0,
        cash_out: props.type === "OUT" ? props.amount : 0,
        note: props.note,
      });
      return res.data as Transaction;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/stores/[storeId]/transactions/[txnId]",
        query: {
          ...router.query,
          txnId: data.id,
        },
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });
  const createTransaction = handleSubmit((data) => submitTrx(data));
  return (
    <>
      <Head>
        <title>Add Transaction | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/transactions`}
          heading={`Add Transaction`}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${store?.id ?? ""}`,
            },
            {
              name: "Transactions",
              path: `/stores/${router.query.storeId as string}/transactions`,
            },
            { name: `Add Transaction` },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "OFFICER" ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Box component="form" onSubmit={(e) => void createTransaction(e)}>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <ToggleButtonGroup
                          color="primary"
                          {...field}
                          exclusive
                          aria-label="Transaction Type"
                          fullWidth
                        >
                          <ToggleButton value="IN" color="success">
                            Cash In
                          </ToggleButton>
                          <ToggleButton value="OUT" color="error">
                            Cash Out
                          </ToggleButton>
                        </ToggleButtonGroup>
                      )}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Transaction Title"
                          type="text"
                          error={!!errors.title}
                          helperText={errors.title?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <Controller
                      name="customer"
                      control={control}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Autocomplete
                          {...field}
                          disabled={isFetchingCustomers}
                          value={
                            customers?.find(({ id }) => id === value) ?? null
                          }
                          options={customers}
                          onChange={(_, data) => onChange(data?.id)}
                          getOptionLabel={(option) => option.name}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Customer"
                              placeholder="Select a Customer"
                              error={!!errors.customer}
                              helperText={errors.customer?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          onChange={(e) => field.onChange(+e.target.value)}
                          label="Amount"
                          type="number"
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel id="category-label">
                            Select Category
                          </InputLabel>
                          <Select
                            labelId="category-label"
                            id="category"
                            label="Select Category"
                            {...field}
                          >
                            <MenuItem value={"SALES"}>Sales</MenuItem>
                            <MenuItem value={"TRANSPORT"}>Transport</MenuItem>
                            <MenuItem value={"BILL"}>Bill</MenuItem>
                          </Select>
                          {errors.category ? (
                            <FormHelperText>
                              {errors.category.message}
                            </FormHelperText>
                          ) : null}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <Controller
                      name="note"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          multiline
                          rows={2}
                          label="Note"
                          error={!!errors.note}
                          helperText={errors.note?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={12} sx={{ textAlign: "right" }}>
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      size="large"
                      loading={isCreatingStock}
                    >
                      Add Transaction
                    </LoadingButton>
                  </Grid>
                </Grid>
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

export default AddTransaction;
