import { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import MaterialReactTable from "material-react-table";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore } from "@/lib/store/stores";
import type { MRT_ColumnDef } from "material-react-table";
import type { Stock } from "@/lib/types";
import PageToolbar from "@/components/PageToolbar";

const StockPage = () => {
  const store = useCurrentStore((state) => state.store);
  const axios = useAxiosAuth();
  const router = useRouter();
  const { data: stocks, isLoading } = useQuery({
    queryKey: ["stock", router.query.storeId],
    queryFn: async () => {
      if (typeof router.query.storeId !== "string") {
        return [] as Stock[];
      }
      const { data } = await axios
        .get<Stock[]>(`api/stores/${router.query.storeId}/stock/`)
        .catch((error) => {
          throw error;
        });
      return data;
    },
  });

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
              path: `/stores/${store?.id ?? ""}`,
            },
            { name: "Stock" },
          ]}
        />

        <ProductStockTable stocks={stocks ?? []} isLoading={isLoading} />
      </Container>
    </>
  );
};

export default StockPage;

const ProductStockTable = ({
  stocks,
  isLoading,
}: {
  stocks: Stock[];
  isLoading: boolean;
}) => {
  const columns = useMemo<MRT_ColumnDef<Stock>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "product.name", header: "Product Name" },
      { accessorKey: "product.group_name", header: "Group Name" },
      { accessorKey: "product.price", header: "Price" },
      { accessorKey: "quantity", header: "Quantity" },
      {
        accessorKey: "product.created_at",
        header: "Created At",
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
        <MaterialReactTable<Stock>
          columns={columns}
          data={stocks}
          state={{ isLoading: isLoading }}
          initialState={{
            sorting: [{ id: "product.created_at", desc: true }],
            density: "compact",
          }}
        />
      </Box>
    </Box>
  );
};
