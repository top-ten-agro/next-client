import { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import NextLink from "next/link";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import MaterialReactTable from "material-react-table";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MuiBreadcrumbs from "@/components/MuiBreadcrumbs";
import axios from "@/lib/axios";
import { useRoleStore } from "@/lib/store/roles";
import { getServerAuthSession } from "@/server/auth";
import type { GetServerSideProps, NextPage } from "next";
import type { MRT_ColumnDef } from "material-react-table";
import type { Stock, ReStock, Store, ListResponse } from "@/lib/types";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);
  if (!session || typeof ctx.params?.storeId !== "string") {
    throw new Error("Access denied");
  }
  const { data } = await axios.get<Store>(`/api/stores/${ctx.params.storeId}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return {
    props: { store: data },
  };
};

const StockPage: NextPage<{ store: Store }> = ({ store }) => {
  const getRole = useRoleStore((state) => state.get);
  const [tab, setTab] = useState("1");

  return (
    <>
      <Head>
        <title>{`Stock - ${store?.name ?? "Store"} | Top Ten`}</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <MuiBreadcrumbs
          items={[
            {
              name: store?.name ?? "store",
              path: `/stores/${store?.id ?? ""}`,
            },
            { name: "Stock" },
          ]}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontSize={36} fontWeight={"bold"} mb={2}>
            Stock
          </Typography>
          {getRole(store?.id)?.role === "OFFICER" ? (
            <Button color="primary" LinkComponent={NextLink} href="/">
              Re-Stock
            </Button>
          ) : null}
        </Box>
        <TabContext value={tab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(e, val) => setTab(val as string)}>
              <Tab label="Products Stock" value={"1"} />
              <Tab label="Re-Stocks" value={"2"} />
            </TabList>
          </Box>
          <TabPanel value={"1"}>
            <ProductStockTable />
          </TabPanel>
          <TabPanel value={"2"}>
            <ReStockTable />
          </TabPanel>
        </TabContext>
      </Container>
    </>
  );
};

export default StockPage;

const ProductStockTable = () => {
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
    <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
      <MaterialReactTable<Stock>
        columns={columns}
        data={stocks ?? []}
        state={{ isLoading: isLoading }}
        initialState={{
          density: "compact",
          sorting: [{ id: "product.created_at", desc: true }],
        }}
      />
    </Box>
  );
};

const ReStockTable = () => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["re-stock", router.query.storeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        omit: "items,store",
        expand: "created_by",
        store: router.query.storeId as string,
      });

      const { data } = await axios
        .get<ListResponse<ReStock>>(`api/restocks/?${params.toString()}`)
        .catch((error) => {
          throw error;
        });
      return data;
    },
  });

  const columns = useMemo<MRT_ColumnDef<ReStock>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "created_by.email", header: "Created By" },
      {
        accessorKey: "approved",
        header: "Approved",
        Cell: ({ cell }) => (cell.getValue<boolean>() ? "Yes" : "No"),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ cell }) =>
          dayjs(cell.getValue<string>()).format("DD/MM/YYYY HH:mm A"),
      },
    ],
    []
  );
  return (
    <MaterialReactTable<ReStock>
      columns={columns}
      data={data?.results ?? []}
      state={{ isLoading: isLoading }}
      enableGlobalFilter={false}
      defaultColumn={{
        enableGlobalFilter: false,
      }}
      initialState={{
        density: "compact",
        sorting: [{ id: "created_at", desc: true }],
      }}
    />
  );
};
