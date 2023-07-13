import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Container from "@mui/material/Container";
import PageToolbar from "@/components/PageToolbar";
import { useDepot, useRole } from "@/lib/store/depot";
import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MaterialReactTable from "material-react-table";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";
import type { Order, ListResponse } from "@/lib/types";
import dayjs from "dayjs";
import { toBdt } from "@/lib/formatter";

const Orders = () => {
  const router = useRouter();
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);
  return (
    <>
      <Head>
        <title>Orders | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Orders"
          backHref={`/depots/${router.query.depotId as string}`}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${router.query.depotId as string}`,
            },
            { name: "Orders" },
          ]}
          action={
            role?.role === "OFFICER"
              ? {
                  text: "New Order",
                  href: `/depots/${router.query.depotId as string}/orders/add`,
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
  const role = useRole((state) => state.role);
  const [count, setCount] = useState(0);
  const [visibility, setVisibility] = useState<MRT_VisibilityState>({
    "created_by.get_full_name": false,
    "balance.customer.id": false,
    subtotal: false,
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

  useEffect(() => {
    if (role?.role === "OFFICER") {
      return setVisibility((prev) => ({
        ...prev,
        "created_by.get_full_name": false,
      }));
    }
    setVisibility((prev) => ({ ...prev, "created_by.get_full_name": true }));
  }, [role?.role]);

  const { data, isLoading, isError, isFetching } = useQuery(
    [
      "orders",
      router.query.depotId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      role?.role,
    ],
    async () => {
      if (!role) {
        throw new Error("Role not found.");
      }
      const params = new URLSearchParams({
        expand: "created_by,balance.customer",
        omit: "items",
        balance__depot: router.query.depotId as string,
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
    {
      onSuccess: (data) => setCount(data.count),
      enabled: !!role,
    }
  );

  const columns = useMemo<MRT_ColumnDef<Order>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: false },
      {
        accessorKey: "balance.customer.id",
        header: "Customer ID",
        enableSorting: false,
      },
      {
        accessorKey: "balance.customer.name",
        header: "Customer",
        enableSorting: false,
      },
      {
        accessorKey: "created_by.get_full_name",
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
        header: "Total",
        accessorKey: "total",
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          return toBdt(+cell.getValue<string>());
        },
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
          onColumnVisibilityChange={setVisibility}
          rowCount={count}
          defaultColumn={{ enableGlobalFilter: false }}
          initialState={{ density: "compact" }}
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
                pathname: "/depots/[depotId]/orders/[orderId]",
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
          renderEmptyRowsFallback={() => (
            <Box sx={{ textAlign: "center", py: 4 }}>
              {columnFilters.some(
                (item) => item.id === "approved" && item.value === "false"
              )
                ? "No new order found."
                : "No order found."}
            </Box>
          )}
        />
      </Box>
    </Box>
  );
};
