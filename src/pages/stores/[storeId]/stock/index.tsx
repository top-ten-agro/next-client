import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import MaterialReactTable from "material-react-table";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore } from "@/lib/store/stores";
import PageToolbar from "@/components/PageToolbar";
import type { ListResponse, ProductStock } from "@/lib/types";
import type {
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";

const StockPage = () => {
  const store = useCurrentStore((state) => state.store);
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`Stock - ${store?.name ?? "Store"} | Top Ten`}</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Stock"
          backHref={store?.id ? `/stores/${store.id}` : undefined}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${router.query.storeId as string}`,
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
  {
    accessorKey: "product.id",
    header: "ID",
    enableSorting: false,
  },

  {
    accessorKey: "product.name",
    header: "Name",
  },
  {
    accessorKey: "product.price",
    header: "Price",
    enableColumnFilter: false,
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
