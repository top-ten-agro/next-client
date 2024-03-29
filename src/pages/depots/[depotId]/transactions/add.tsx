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
import { useDepot, useRole } from "@/lib/store/depot";
import type { Transaction, Customer } from "@/lib/types";

type PartialBalance = { id: number; customer: Pick<Customer, "id" | "name"> };

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  category: z.enum(["SALES", "TRANSPORT", "BILL"]),
  note: z.string().optional(),
  balance: z.number().int().optional(),
  amount: z.number().min(1, "Amount is too small."),
});

const AddTransaction = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  const isRoleLoading = useRole((state) => state.isLoading);

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

  const { data: customers, isFetching: isFetchingCustomers } = useQuery(
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

  const { mutate: submitTrx, isLoading: isCreatingStock } = useMutation({
    mutationKey: ["transaction", "create-transaction", router.query.depotId],
    mutationFn: async (props: z.infer<typeof schema>) => {
      const res = await axios.post(`api/transactions/`, {
        depot: parseInt(router.query.depotId as string),
        title: props.title,
        category: props.category,
        balance: props.balance,
        cash_in: props.type === "IN" ? props.amount : 0,
        cash_out: props.type === "OUT" ? props.amount : 0,
        note: props.note,
      });
      return res.data as Transaction;
    },
    onSuccess: (data) => {
      if (!data) return;
      void router.push({
        pathname: "/depots/[depotId]/transactions/[txnId]",
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
          backHref={`/depots/${router.query.depotId as string}/transactions`}
          heading={`Add Transaction`}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${depot?.id ?? ""}`,
            },
            {
              name: "Transactions",
              path: `/depots/${router.query.depotId as string}/transactions`,
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
                      name="balance"
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
                          getOptionLabel={(option) => option.customer.name}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Customer"
                              placeholder="Select a Customer"
                              error={!!errors.balance}
                              helperText={errors.balance?.message}
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
