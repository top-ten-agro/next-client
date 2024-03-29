import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import MaterialReactTable from "material-react-table";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";
import type { ReStock, ListResponse } from "@/lib/types";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { useDepot, useRole } from "@/lib/store/depot";
import dayjs from "dayjs";
import PageToolbar from "@/components/PageToolbar";

const Restocks = () => {
  const depot = useDepot((state) => state.depot);
  const role = useRole((state) => state.role);

  return (
    <>
      <Head>
        <title>Re-Stocks | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={depot?.id ? `/depots/${depot.id}` : undefined}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${depot?.id ?? ""}`,
            },
            { name: "Re-Stocks" },
          ]}
          action={
            role?.role === "MANAGER"
              ? {
                  text: "New Re-Stock",
                  href: `/depots/${depot?.id ?? ""}/restocks/add`,
                }
              : undefined
          }
          heading="Re-Stocks"
        />

        <ReStockTable />
      </Container>
    </>
  );
};

export default Restocks;

const ReStockTable = () => {
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
      "re-stock",
      router.query.depotId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        omit: "items,depot",
        expand: "created_by",
        depot: router.query.depotId as string,
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
        .get<ListResponse<ReStock>>(`api/restocks/?${params.toString()}`)
        .catch((error) => {
          throw error;
        });
      return data;
    },
    onSuccess: (data) => setCount(data.count),
  });

  const columns = useMemo<MRT_ColumnDef<ReStock>[]>(
    () => [
      { accessorKey: "id", header: "ID", enableSorting: false },
      {
        accessorKey: "created_by.email",
        header: "Created By",
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
        <MaterialReactTable<ReStock>
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
                pathname: "/depots/[depotId]/restocks/[restockId]",
                query: {
                  ...router.query,
                  restockId: row.getValue<string>("id"),
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
