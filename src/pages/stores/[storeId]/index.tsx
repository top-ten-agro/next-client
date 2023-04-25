import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import MuiBreadcrumbs from "@/components/MuiBreadcrumbs";
import Typography from "@mui/material/Typography";
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

import type { AxiosInstance } from "axios";
import type { Store } from "@/lib/types";

const routes = [
  { name: "Product Stock", path: "stock", icon: <CategoryIcon /> },
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
        <MuiBreadcrumbs
          items={[
            { name: "Stores", path: "/stores" },
            { name: store ? store.name : isLoading ? "loading..." : "" },
          ]}
        />
        <Typography fontSize={36} fontWeight={"bold"} mb={2}>
          {isLoading ? "loading..." : store?.name}
        </Typography>
        {isLoading ? <LinearProgress /> : null}
        {store ? (
          <Grid container spacing={2}>
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
