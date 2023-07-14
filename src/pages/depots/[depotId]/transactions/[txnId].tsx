import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { z } from "zod";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
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
import type { Transaction } from "@/lib/types";
import { AxiosError } from "axios";
import { useMemo } from "react";
import dayjs from "dayjs";

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  category: z.enum(["SALES", "TRANSPORT", "BILL"]),
  note: z.string().optional(),
  amount: z.number().min(1, "Amount is too small."),
});

const TransactionPage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);

  const {
    control,
    formState: { errors },
    reset,
    watch,
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
  const allFields = watch();

  const {
    data: transaction,
    isLoading,
    refetch: refetchTransaction,
  } = useQuery({
    queryKey: ["transaction", "fetch-transaction", router.query.txnId],
    queryFn: async () => {
      const id = router.query.txnId as string;
      const { data } = await axios.get<Transaction>(
        `api/transactions/${id}/?expand=created_by,balance.customer`
      );
      return data;
    },
    onSuccess: (data) => {
      const { cash_in, cash_out } = data;
      reset({
        category: data.category,
        amount: +cash_in > 0 ? +data.cash_in : +cash_out,
        note: data.note ?? undefined,
        title: data.title,
        type: +cash_in > 0 ? "IN" : "OUT",
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });

  const { mutate: submitTrx, isLoading: isUpdatingStock } = useMutation({
    mutationKey: ["transaction", "create-transaction", router.query.depotId],
    mutationFn: async (props: z.infer<typeof schema>) => {
      if (!transaction || transaction.approved === true) {
        throw new Error("Cannot update this transaction.");
      }

      const res = await axios.put(
        `api/transactions/${router.query.txnId as string}/`,
        {
          depot: transaction.depot,
          balance: transaction.balance?.id,
          title: props.title,
          category: props.category,
          cash_in: props.type === "IN" ? props.amount : 0,
          cash_out: props.type === "OUT" ? props.amount : 0,
          note: props.note,
        }
      );
      return res.data as Transaction;
    },

    onSuccess: () => {
      void refetchTransaction();
      toast.success("Update successful.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create.");
    },
  });

  const { mutate: deleteTransaction, isLoading: isDeletingTransaction } =
    useMutation({
      mutationKey: ["delete-transaction", transaction?.id],
      mutationFn: async () => {
        if (!transaction) {
          throw new Error("Transaction object not found.");
        }
        const confirmed = confirm(`Delete Transaction #${transaction.id}?`);
        if (!confirmed) {
          throw new Error("Process cancelled.");
        }
        await axios.delete(`api/transactions/${transaction.id}/remove/`);
      },
      onSuccess: () => {
        void router.push({
          pathname: "/depots/[depotId]/transactions",
          query: { ...router.query },
        });
      },

      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create."
        );
      },
    });
  const { mutate: approveTransaction, isLoading: isApproving } = useMutation({
    mutationKey: ["transaction", "approve-transaction", transaction?.id],
    mutationFn: async () => {
      if (!transaction) {
        throw new Error("Transaction object not found.");
      }
      const confirmed = confirm(`Approve Transaction #${transaction.id}?`);
      if (!confirmed) {
        throw new Error("Process cancelled.");
      }
      await axios.put(`api/transactions/${transaction.id}/approve/`);
    },
    onSuccess: () => {
      toast.success("Transaction approved.");
      void refetchTransaction();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve."
      );
    },
  });

  const updateTransaction = handleSubmit((data) => submitTrx(data));

  const permissions = useMemo(
    () => ({
      canUpdate:
        transaction?.approved === false &&
        (role?.role === "MANAGER" ||
          (role?.role === "OFFICER" &&
            transaction?.created_by.id === role.user)),
      canDelete:
        role?.role === "MANAGER" ||
        (transaction?.approved === false &&
          role?.role === "OFFICER" &&
          transaction?.created_by.id === role.user),
      canApprove: transaction?.approved === false && role?.role === "MANAGER",
    }),
    [transaction?.approved, transaction?.created_by.id, role?.role, role?.user]
  );
  const notUpdated = useMemo(() => {
    if (!transaction) return true;
    return (
      allFields.title === transaction.title &&
      (allFields.amount === Number(transaction.cash_in) ||
        allFields.amount === Number(transaction.cash_out)) &&
      allFields.category === transaction.category &&
      allFields.note == transaction.note
    );
  }, [transaction, allFields]);

  return (
    <>
      <Head>
        <title>{`Transaction #${transaction?.id ?? ""}`} | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/depots/${router.query.depotId as string}/transactions`}
          heading={`Transaction #${transaction?.id ?? ""}`}
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
            { name: `Transaction #${transaction?.id ?? ""}` },
          ]}
        />
        {isLoading ? (
          <LinearProgress />
        ) : transaction ? (
          <Grid container spacing={2}>
            <Grid xs={12} md={6} order={{ xs: 2, md: 1 }}>
              <Box component="form" onSubmit={(e) => void updateTransaction(e)}>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <ToggleButtonGroup
                          disabled
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
                          disabled={transaction.approved}
                          label="Transaction Title"
                          type="text"
                          error={!!errors.title}
                          helperText={errors.title?.message}
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
                          disabled={transaction.approved}
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
                            disabled={transaction.approved}
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
                          disabled={transaction.approved}
                          multiline
                          rows={2}
                          label="Note"
                          error={!!errors.note}
                          helperText={errors.note?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={12}>
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
                          type="submit"
                          loading={isUpdatingStock}
                          disabled={notUpdated}
                        >
                          Update
                        </LoadingButton>
                      ) : null}
                      {permissions.canDelete ? (
                        <LoadingButton
                          variant="text"
                          type="button"
                          color="error"
                          loading={isDeletingTransaction}
                          onClick={() => deleteTransaction()}
                        >
                          Delete
                        </LoadingButton>
                      ) : null}

                      {permissions.canApprove ? (
                        <LoadingButton
                          variant="contained"
                          type="button"
                          loading={isApproving}
                          onClick={() => approveTransaction()}
                          sx={{ mr: "auto" }}
                          disabled={!notUpdated}
                        >
                          Approve
                        </LoadingButton>
                      ) : null}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid xs={12} md={6} order={{ xs: 1, md: 2 }}>
              <List dense sx={{ mb: 2 }}>
                {transaction.balance ? (
                  <ListItem sx={{ p: 0 }}>
                    <ListItemButton
                      LinkComponent={NextLink}
                      href={`/depots/${
                        router.query.depotId as string
                      }/customers/${transaction.balance.id ?? ""}`}
                    >
                      <ListItemText
                        primary={"Customer"}
                        secondary={transaction.balance.customer.name}
                      />
                    </ListItemButton>
                  </ListItem>
                ) : null}
                <ListItem>
                  <ListItemText
                    primary={"Created at"}
                    secondary={dayjs(transaction.created_at).format(
                      "DD/MM/YYYY HH:mm A"
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created by"}
                    secondary={transaction.created_by.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Approved"}
                    secondary={transaction.approved ? "Yes" : "No"}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        ) : null}
      </Container>
    </>
  );
};

export default TransactionPage;
