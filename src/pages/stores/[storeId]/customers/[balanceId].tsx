import { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import List from "@mui/material/List";
import TabList from "@mui/lab/TabList";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TableRow from "@mui/material/TableRow";
import Container from "@mui/material/Container";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Grid from "@mui/material/Unstable_Grid2";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TableContainer from "@mui/material/TableContainer";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import LoadingButton from "@mui/lab/LoadingButton";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MaterialReactTable from "material-react-table";
import type { CustomerBalance, UserRole } from "@/lib/types";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import { toBdt } from "@/lib/formatter";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";
import type { Transaction, Order, ListResponse } from "@/lib/types";
import { AxiosError } from "axios";

const CustomerPage = () => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role?.role);
  const [value, setValue] = useState("1");
  const [officer, setOfficer] = useState("");

  const {
    data: balance,
    isLoading,
    refetch: refetchBalance,
  } = useQuery(
    ["balance", router.query.balanceId],
    async () => {
      const id = router.query.balanceId as string;
      const { data } = await axios.get<CustomerBalance>(
        `api/balances/${id}/?expand=customer,officer.user`
      );
      return data;
    },
    {
      onSuccess: (data) => data.officer && setOfficer(`${data.officer.id}`),
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 404)
          return void router.push("/404");
        toast.error("An error occured.");
      },
    }
  );

  const { data: roles } = useQuery(
    ["roles", router.query.storeId],
    async () => {
      const { data } = await axios.get<UserRole[]>(
        `api/stores/${router.query.storeId as string}/roles/?expand=user`
      );
      return data.filter((role) => role.role === "OFFICER");
    },
    { enabled: role === "MANAGER" }
  );
  const { mutate: updateOfficer, isLoading: isUpdating } = useMutation(
    ["set-officer", officer],
    async () => {
      if (!balance) throw new Error("Balance not found.");
      if (!roles) throw new Error("Roles not loaded.");
      await axios.patch(`api/balances/${balance.id}/`, {
        officer: officer ? +officer : null,
      });
    },
    {
      onSuccess: () => {
        toast.success("Officer updated.");
        void refetchBalance();
      },
      onError: () => toast.error("An error occured."),
    }
  );

  return (
    <>
      <Head>
        <title>{balance?.customer.name ?? "Customer"} | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/customers`}
          heading={balance?.customer.name ?? "Customer"}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${router.query.storeId as string}`,
            },
            {
              name: "Customers",
              path: `/stores/${router.query.storeId as string}/customers`,
            },
            { name: balance?.customer.name ?? "Customer" },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : balance ? (
          <Box>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <List>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocalPhoneIcon />
                    </ListItemIcon>
                    <ListItemText>{balance.customer.phone}</ListItemText>
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocationOnIcon />
                    </ListItemIcon>
                    <ListItemText>{balance.customer.address}</ListItemText>
                  </ListItem>
                  {role === "MANAGER" ? (
                    <ListItem sx={{ pb: 0 }}>
                      <ListItemText>
                        <TextField
                          label="Select officer"
                          select
                          size="small"
                          value={officer}
                          SelectProps={{ native: true }}
                          InputLabelProps={{ shrink: true }}
                          onChange={(e) => setOfficer(e.target.value)}
                        >
                          <option value="" disabled>
                            Select an option.
                          </option>
                          {roles
                            ? roles.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.user.email}
                                </option>
                              ))
                            : null}
                        </TextField>
                      </ListItemText>
                      <ListItemText>
                        <LoadingButton
                          sx={{ mx: 1 }}
                          loading={isUpdating}
                          disabled={
                            balance.officer
                              ? balance.officer.id === +officer
                              : false
                          }
                          variant="contained"
                          onClick={() => updateOfficer()}
                        >
                          update
                        </LoadingButton>
                      </ListItemText>
                    </ListItem>
                  ) : (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <EngineeringIcon />
                      </ListItemIcon>
                      <ListItemText>{balance.officer?.user.email}</ListItemText>
                    </ListItem>
                  )}
                </List>
              </Grid>
              <Grid xs={12} md={6}>
                <BalanceTable balance={balance} />
              </Grid>
            </Grid>

            <Box sx={{ height: 20 }} />
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList
                  onChange={(e, val) => setValue(val as string)}
                  aria-label="lab API tabs example"
                >
                  <Tab label="Orders" value="1" />
                  <Tab label="Transactions" value="2" />
                </TabList>
              </Box>
              <TabPanel value="1" sx={{ padding: 0 }}>
                <OrdersTable customerId={balance.customer.id} />
              </TabPanel>
              <TabPanel value="2" sx={{ padding: 0 }}>
                <TransactionsTable customerId={balance.customer.id} />
              </TabPanel>
            </TabContext>
          </Box>
        ) : null}
      </Container>
    </>
  );
};

export default CustomerPage;

const BalanceTable = ({ balance }: { balance: CustomerBalance }) => (
  <TableContainer component={Paper} sx={{ maxWidth: 320 }}>
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell component="th" scope="row">
            Sales
          </TableCell>
          <TableCell align="right">{toBdt(+balance.sales)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Paid
          </TableCell>
          <TableCell align="right">{toBdt(+balance.cash_in)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Due
          </TableCell>
          <TableCell align="right">
            {toBdt(+balance.sales - +balance.cash_in)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

const OrdersTable = ({ customerId }: { customerId: number }) => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      "orders",
      customerId,
      router.query.storeId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        expand: "created_by",
        store: router.query.storeId as string,
        customer: `${customerId}`,
        per_page: `${pagination.pageSize}`,
        page: `${pagination.pageIndex + 1}`,
      });
      if (sorting.length) {
        params.set(
          "ordering",
          sorting.map((item) => `${item.desc ? "-" : ""}${item.id}`).join()
        );
      }

      columnFilters.forEach((item) => {
        if (typeof item.value === "boolean") {
          return void params.append(item.id, item.value ? "true" : "false");
        }
        params.append(item.id, `${item.value as string}`);
      });

      const { data } = await axios
        .get<ListResponse<Order>>(`api/orders/?${params.toString()}`)
        .catch((error) => {
          throw error;
        });
      return data;
    },
    onSuccess: (data) => setCount(data.count),
  });

  const columns = useMemo<MRT_ColumnDef<Order>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: false },
      {
        accessorKey: "created_by.email",
        header: "Officer",
      },
      {
        accessorKey: "approved",
        header: "Approved",
        Cell: ({ cell }) =>
          cell.getValue<boolean>() ? (
            <DoneIcon color="success" />
          ) : (
            <CloseIcon color="error" />
          ),
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center", sx: { p: 0 } },
        enableColumnFilter: false,
      },
      {
        accessorKey: "subtotal",
        header: "Subtotal",
        enableColumnFilter: false,
        Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },
      {
        accessorKey: "total",
        header: "Total",
        enableColumnFilter: false,
        Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          dayjs(cell.getValue<string>()).format("DD/MM/YYYY HH:mm A"),
      },
    ],
    []
  );
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          overflowX: "auto",
          width: "100%",
        }}
      >
        <MaterialReactTable<Order>
          columns={columns}
          data={data?.results ?? []}
          enableGlobalFilter={false}
          manualFiltering
          manualPagination
          manualSorting
          onColumnFiltersChange={setColumnFilters}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          rowCount={count}
          state={{
            columnFilters,
            isLoading,
            pagination,
            showAlertBanner: isError,
            showProgressBars: isFetching,
            sorting,
          }}
          muiTablePaperProps={{ variant: "elevation", elevation: 0 }}
          muiTableBodyRowProps={({ row }) => ({
            sx: { cursor: "pointer" },
            onClick: () =>
              void router.push({
                pathname: "/stores/[storeId]/orders/[orderId]",
                query: {
                  ...router.query,
                  orderId: row.getValue<string>("id"),
                },
              }),
          })}
          muiToolbarAlertBannerProps={
            isError
              ? {
                  color: "error",
                  children: "Error loading data",
                }
              : undefined
          }
          defaultColumn={{
            enableGlobalFilter: false,
          }}
          initialState={{
            density: "compact",
            columnVisibility: { "customer.id": false, subtotal: false },
          }}
        />
      </Box>
    </Box>
  );
};

const TransactionsTable = ({ customerId }: { customerId: number }) => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      "transactions",
      customerId,
      router.query.storeId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        expand: "created_by",
        customer: `${customerId}`,
        store: router.query.storeId as string,
        per_page: `${pagination.pageSize}`,
        page: `${pagination.pageIndex + 1}`,
      });
      if (sorting.length) {
        params.set(
          "ordering",
          sorting.map((item) => `${item.desc ? "-" : ""}${item.id}`).join()
        );
      }

      columnFilters.forEach((item) => {
        if (typeof item.value === "boolean") {
          return void params.set(item.id, item.value ? "true" : "false");
        }
        params.set(item.id, `${item.value as string}`);
      });

      const { data } = await axios
        .get<ListResponse<Transaction>>(
          `api/transactions/?${params.toString()}`
        )
        .catch((error) => {
          throw error;
        });
      return data;
    },
    onSuccess: (data) => setCount(data.count),
  });

  const columns = useMemo<MRT_ColumnDef<Transaction>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: false, size: 100 },

      { accessorKey: "title", header: "Title" },

      {
        accessorKey: "approved",
        header: "Approved",
        Cell: ({ cell }) =>
          cell.getValue<boolean>() ? (
            <DoneIcon color="success" />
          ) : (
            <CloseIcon color="error" />
          ),
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center", sx: { p: 0 } },
        enableColumnFilter: false,
      },
      {
        accessorKey: "cash_in",
        header: "In",
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          +cell.getValue<string>() > 0 ? toBdt(+cell.getValue<string>()) : "-",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },
      {
        accessorKey: "cash_out",
        header: "Out",
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          +cell.getValue<string>() > 0 ? toBdt(+cell.getValue<string>()) : "-",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },

      {
        accessorKey: "created_at",
        header: "Created At",
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          dayjs(cell.getValue<string>()).format("DD/MM/YYYY HH:mm A"),
      },
    ],
    []
  );
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          overflowX: "auto",
          width: "100%",
        }}
      >
        <MaterialReactTable<Transaction>
          columns={columns}
          data={data?.results ?? []}
          enableGlobalFilter={false}
          manualFiltering
          manualPagination
          manualSorting
          onColumnFiltersChange={setColumnFilters}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          rowCount={count}
          state={{
            columnFilters,
            isLoading,
            pagination,
            showAlertBanner: isError,
            showProgressBars: isFetching,
            sorting,
          }}
          muiTableBodyRowProps={({ row }) => ({
            sx: { cursor: "pointer" },
            onClick: () =>
              void router.push({
                pathname: "/stores/[storeId]/transactions/[txnId]",
                query: {
                  ...router.query,
                  txnId: row.getValue<string>("id"),
                },
              }),
          })}
          muiToolbarAlertBannerProps={
            isError
              ? {
                  color: "error",
                  children: "Error loading data",
                }
              : undefined
          }
          defaultColumn={{
            enableGlobalFilter: false,
          }}
          initialState={{
            density: "compact",
            columnVisibility: { "customer.id": false },
          }}
        />
      </Box>
    </Box>
  );
};
