import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import MaterialReactTable from "material-react-table";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useDepot } from "@/lib/store/depot";
import PageToolbar from "@/components/PageToolbar";
import type { ListResponse, ProductStock } from "@/lib/types";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";
import { toBdt } from "@/lib/formatter";

const StockPage = () => {
  const depot = useDepot((state) => state.depot);
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`Stock - ${depot?.name ?? "Depot"} | Top Ten`}</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Stock"
          backHref={depot?.id ? `/depots/${depot.id}` : undefined}
          breadcrumbItems={[
            { name: "Depots", path: `/depots` },
            {
              name: depot?.name ?? "depot",
              path: `/depots/${router.query.depotId as string}`,
            },
            { name: "Stock" },
          ]}
        />

        <ProductStockTable />
      </Container>
    </>
  );
};

export default StockPage;

const ProductStockTable = () => {
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
      "stocks",
      router.query.depotId,
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        depot: router.query.depotId as string,
        per_page: `${pagination.pageSize}`,
        page: `${pagination.pageIndex + 1}`,
      });
      if (sorting.length) {
        params.set(
          "ordering",
          sorting
            .map((item) => {
              const id =
                item.id === "product.id"
                  ? "product"
                  : item.id.replace(".", "__");
              return `${item.desc ? "-" : ""}${id}`;
            })
            .join()
        );
      }

      columnFilters.forEach((item) => {
        params.set(item.id, `${item.value as string}`);
      });

      const { data } = await axios
        .get<ListResponse<ProductStock>>(`api/stocks/?${params.toString()}`)
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
        <MaterialReactTable<ProductStock>
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

const columns: MRT_ColumnDef<ProductStock>[] = [
  { accessorKey: "product.id", header: "ID", enableSorting: false },
  { accessorKey: "product.name", header: "Name" },
  { accessorKey: "product.pack_size", header: "Pack Size" },
  {
    accessorKey: "product.price",
    header: "Price",
    enableColumnFilter: false,
    Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
    muiTableHeadCellProps: { align: "right" },
    muiTableBodyCellProps: { align: "right" },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    enableColumnFilter: false,
    muiTableHeadCellProps: { align: "center" },
    muiTableBodyCellProps: { align: "center" },
  },
];
