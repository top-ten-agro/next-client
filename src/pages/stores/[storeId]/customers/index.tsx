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
import type { CustomerBalance, ListResponse } from "@/lib/types";
import { toBdt } from "@/lib/formatter";

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
      "balancecs",
      router.query.storeId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
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
        params.append(item.id, `${item.value as string}`);
      });

      const { data } = await axios
        .get<ListResponse<CustomerBalance>>(
          `api/balances/?${params.toString()}`
        )
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
        <MaterialReactTable<CustomerBalance>
          columns={columns}
          data={data ? data.results : []}
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
                pathname: "/stores/[storeId]/customers/[balanceId]",
                query: {
                  ...router.query,
                  balanceId: row.getValue<string>("id"),
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

const columns: MRT_ColumnDef<CustomerBalance>[] = [
  {
    accessorKey: "customer.id",
    header: "ID",
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: "Balance ID",
  },
  {
    accessorKey: "customer.name",
    header: "Name",
    enableSorting: false,
  },
  {
    accessorKey: "customer.phone",
    header: "Phone",
    enableSorting: false,
  },
  {
    accessorKey: "revenue",
    header: "Sales",
    enableColumnFilter: false,
    Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
    muiTableHeadCellProps: { align: "right" },
    muiTableBodyCellProps: { align: "right" },
  },
  {
    accessorKey: "cash_in",
    header: "Cash In",
    enableColumnFilter: false,
    Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
    muiTableHeadCellProps: { align: "right" },
    muiTableBodyCellProps: { align: "right" },
  },
];
