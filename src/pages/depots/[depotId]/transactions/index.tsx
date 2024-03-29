import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Container from "@mui/material/Container";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MaterialReactTable from "material-react-table";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useDepot, useRole } from "@/lib/store/depot";
import { toBdt } from "@/lib/formatter";
import PageToolbar from "@/components/PageToolbar";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";
import type { Transaction, ListResponse } from "@/lib/types";

const Transactions = () => {
  const router = useRouter();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  return (
    <>
      <Head>
        <title>Transactions | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Transactions"
          backHref={`/depots/${router.query.depotId as string}`}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${router.query.depotId as string}`,
            },
            { name: "Transactions" },
          ]}
          action={
            role?.role === "OFFICER"
              ? {
                  text: (
                    <>
                      <AddIcon sx={{ display: { sm: "none" } }} />
                      <Typography
                        sx={{ display: { xs: "none", sm: "inline" } }}
                      >
                        New Transaction
                      </Typography>
                    </>
                  ),
                  href: `/depots/${
                    router.query.depotId as string
                  }/transactions/add`,
                }
              : undefined
          }
        />
        <TransactionsTable />
      </Container>
    </>
  );
};

export default Transactions;

const TransactionsTable = () => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const role = useRole((state) => state.role);
  const [visibility, setVisibility] = useState<MRT_VisibilityState>({
    "created_by.email": false,
    id: false,
    title: false,
    category: false,
    "balance.customer.id": false,
  });

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([
    { id: "approved", value: "false" },
  ]);
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, isFetching } = useQuery(
    [
      "transactions",
      router.query.depotId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    async () => {
      if (!role) throw new Error("Role not found.");
      const params = new URLSearchParams({
        expand: "created_by,balance.customer",
        depot: router.query.depotId as string,
        per_page: `${pagination.pageSize}`,
        page: `${pagination.pageIndex + 1}`,
      });
      if (role.role === "OFFICER") {
        params.set("created_by", `${role.user}`);
      }
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
    {
      enabled: !!role,
      onSuccess: (data) => setCount(data.count),
    }
  );
  const columns = useMemo<MRT_ColumnDef<Transaction>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: false, size: 100 },
      { accessorKey: "title", header: "Title" },
      {
        accessorKey: "category",
        header: "Category",
        filterVariant: "select",
        Cell: ({ cell }) => (
          <Chip size="small" label={cell.getValue<string>().toLowerCase()} />
        ),
        filterSelectOptions: [
          { text: "Sales", value: "SALES" },
          { text: "Transport", value: "TRANSPORT" },
          { text: "Bill", value: "BILL" },
        ],

        muiTableBodyCellProps: { sx: { p: 0 } },
      },
      {
        accessorKey: "balance.customer.name",
        header: "Customer",
        enableSorting: false,
        Cell: ({ cell }) => cell.getValue<string | undefined>() ?? "-",
      },
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
        filterVariant: "checkbox",
        size: 100,
      },
      {
        accessorKey: "cash_in",
        header: "Cash In",
        enableColumnFilter: false,
        Cell: ({ cell }) =>
          +cell.getValue<string>() > 0 ? toBdt(+cell.getValue<string>()) : "-",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },
      {
        accessorKey: "cash_out",
        header: "Cash Out",
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
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
      },
    ],
    []
  );

  useEffect(() => {
    setVisibility((prev) => ({
      ...prev,
      "created_by.email": role?.role === "OFFICER" ? false : true,
    }));
  }, [role?.role]);
  useEffect(() => {
    setVisibility((prev) => ({
      ...prev,
      cash_out: data?.results.some((item) => +item.cash_out > 0) ?? false,
    }));
  }, [data?.results]);

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
          onColumnVisibilityChange={setVisibility}
          rowCount={count}
          state={{
            columnFilters,
            isLoading,
            pagination,
            showAlertBanner: isError,
            showProgressBars: isFetching,
            sorting,
            columnVisibility: visibility,
          }}
          muiTableBodyRowProps={({ row }) => ({
            sx: { cursor: "pointer" },
            onClick: () =>
              void router.push({
                pathname: "/depots/[depotId]/transactions/[txnId]",
                query: { ...router.query, txnId: row.getValue<string>("id") },
              }),
          })}
          muiToolbarAlertBannerProps={
            isError
              ? { color: "error", children: "Error loading data" }
              : undefined
          }
          defaultColumn={{ enableGlobalFilter: false }}
          initialState={{ density: "compact" }}
        />
      </Box>
    </Box>
  );
};
