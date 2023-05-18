import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Grid from "@mui/material/Unstable_Grid2";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";

import ReceiptIcon from "@mui/icons-material/Receipt";
import MoneyIcon from "@mui/icons-material/Money";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import PostAddIcon from "@mui/icons-material/PostAdd";

import type { AxiosInstance } from "axios";
import type { Store } from "@/lib/types";
import PageToolbar from "@/components/PageToolbar";
import { useStoreRole } from "@/lib/store/stores";
import { useSession } from "next-auth/react";

const routes = [
  { name: "Product Stock", path: "stock", icon: <CategoryIcon /> },
  { name: "Re-Stock", path: "restocks", icon: <PostAddIcon /> },
  { name: "Customers", path: "customers", icon: <PeopleIcon /> },
  { name: "Orders", path: "orders", icon: <ReceiptIcon /> },
  { name: "Transactions", path: "transactions", icon: <MoneyIcon /> },
];

const fetchStore = async (axios: AxiosInstance, id: string) => {
  const { data } = await axios
    .get<Store>(`api/stores/${id}/`)
    .catch((error) => {
      throw error;
    });
  return data;
};

const StorePage = () => {
  const { query } = useRouter();
  const role = useStoreRole((state) => state.role);
  const { data: session } = useSession({ required: true });
  const axios = useAxiosAuth();
  const { data: store, isLoading } = useQuery({
    queryKey: ["store", query.storeId],
    queryFn: () => fetchStore(axios, query.storeId as string),
    enabled: !!query.storeId,
  });

  return (
    <>
      <Head>
        <title>{`${
          store ? store.name : isLoading ? "loading..." : ""
        } | Top Ten`}</title>
        <meta name="description" content={store?.address} />
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref="/stores"
          heading={isLoading ? "loading..." : store?.name ?? "Store"}
          breadcrumbItems={[
            { name: "Stores", path: "/stores" },
            { name: store ? store.name : isLoading ? "loading..." : "" },
          ]}
        />

        {isLoading ? <LinearProgress /> : null}
        {store ? (
          <Grid container spacing={2}>
            <Grid xs={12}>
              <ListItem>
                <ListItemText
                  primary={
                    session
                      ? `${session?.user.first_name} ${session?.user.last_name}`
                      : "User"
                  }
                  secondary={role?.role.toLowerCase() ?? "user role"}
                ></ListItemText>
              </ListItem>
            </Grid>
            {routes.map((route) => (
              <Grid key={route.name} xs={12} sm={6} md={3}>
                <Card>
                  <ListItem disablePadding>
                    <ListItemButton
                      LinkComponent={NextLink}
                      href={`/stores/${query.storeId as string}/${route.path}`}
                    >
                      <ListItemIcon>{route.icon}</ListItemIcon>
                      <ListItemText>{route.name}</ListItemText>
                    </ListItemButton>
                  </ListItem>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Container>
    </>
  );
};

export default StorePage;
