/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useState } from "react";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import PageToolbar from "@/components/PageToolbar";
import { useCurrentStore } from "@/lib/store/stores";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MaterialReactTable from "material-react-table";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";
import type { Balance, Customer, ListResponse } from "@/lib/types";

const Customers = () => {
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);

  return (
    <>
      <Head>
        <title>Customers | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Customers"
          backHref={`/stores/${router.query.storeId as string}`}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${router.query.storeId as string}`,
            },
            { name: "Customers" },
          ]}
        />
        <CustomersTable />
      </Container>
    </>
  );
};

export default Customers;

const CustomersTable = () => {
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
      "customers",
      router.query.storeId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        expand: "balances",
        stores: router.query.storeId as string,
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
        .get<
          ListResponse<
            Customer & { balances: Omit<Balance, "customer" | "store">[] }
          >
        >(`api/customers/?${params.toString()}`)
        .catch((error) => {
          throw error;
        });
      return data;
    },
    onSuccess: (data) => setCount(data.count),
  });
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
        <MaterialReactTable<Customer & Omit<Balance, "customer" | "store">>
          columns={columns}
          data={
            data
              ? data.results.map(({ balances, ...customer }) => ({
                  ...customer,
                  revenue: balances[0]!.revenue,
                  cash_in: balances[0]!.cash_in,
                }))
              : []
          }
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
                pathname: "/stores/[storeId]/customers/[customerId]",
                query: {
                  ...router.query,
                  customerId: row.getValue<string>("id"),
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
          initialState={{ density: "compact" }}
        />
      </Box>
    </Box>
  );
};

const columns: MRT_ColumnDef<Customer & Omit<Balance, "customer" | "store">>[] =
  [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "revenue",
      header: "Sales",
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "right" },
      muiTableBodyCellProps: { align: "right" },
    },
    {
      accessorKey: "cash_in",
      header: "Cash In",
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "right" },
      muiTableBodyCellProps: { align: "right" },
    },
  ];
