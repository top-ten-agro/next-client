import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Container from "@mui/material/Container";
import PageToolbar from "@/components/PageToolbar";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MaterialReactTable from "material-react-table";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";
import type { Order, ListResponse } from "@/lib/types";
import dayjs from "dayjs";

const Orders = () => {
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  return (
    <>
      <Head>
        <title>Orders | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Orders"
          backHref={`/stores/${router.query.storeId as string}`}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${router.query.storeId as string}`,
            },
            { name: "Orders" },
          ]}
          action={
            role?.role === "OFFICER"
              ? {
                  text: "New Order",
                  href: `/stores/${router.query.storeId as string}/orders/add`,
                }
              : undefined
          }
        />
        <OrdersTable />
      </Container>
    </>
  );
};

export default Orders;

const OrdersTable = () => {
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
      router.query.storeId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        expand: "created_by,customer",
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
        accessorKey: "customer.id",
        header: "Customer ID",
        enableSorting: false,
      },
      {
        accessorKey: "customer.name",
        header: "Customer",
        enableSorting: false,
      },
      {
        accessorKey: "created_by.email",
        header: "Created By",
      },
      {
        accessorKey: "approved",
        header: "Approved",
        filterVariant: "select",
        filterSelectOptions: [
          { text: "Yes", value: true },
          { text: "No", value: false },
        ],
        Cell: ({ cell }) => (cell.getValue<boolean>() ? "Yes" : "No"),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableColumnFilter: false,
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
            columnVisibility: { "customer.id": false },
          }}
        />
      </Box>
    </Box>
  );
};
