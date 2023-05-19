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
import type { Depot } from "@/lib/types";
import PageToolbar from "@/components/PageToolbar";
import { useRole } from "@/lib/store/depot";
import { useSession } from "next-auth/react";

const routes = [
  { name: "Product Stock", path: "stock", icon: <CategoryIcon /> },
  { name: "Re-Stock", path: "restocks", icon: <PostAddIcon /> },
  { name: "Customers", path: "customers", icon: <PeopleIcon /> },
  { name: "Orders", path: "orders", icon: <ReceiptIcon /> },
  { name: "Transactions", path: "transactions", icon: <MoneyIcon /> },
];

const fetchDepot = async (axios: AxiosInstance, id: string) => {
  const { data } = await axios
    .get<Depot>(`api/depots/${id}/`)
    .catch((error) => {
      throw error;
    });
  return data;
};

const DepotPage = () => {
  const { query } = useRouter();
  const role = useRole((state) => state.role);
  const { data: session } = useSession({ required: true });
  const axios = useAxiosAuth();
  const { data: depot, isLoading } = useQuery({
    queryKey: ["depot", query.depotId],
    queryFn: () => fetchDepot(axios, query.depotId as string),
    enabled: !!query.depotId,
  });

  return (
    <>
      <Head>
        <title>{`${
          depot ? depot.name : isLoading ? "loading..." : ""
        } | Top Ten`}</title>
        <meta name="description" content={depot?.address} />
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref="/depots"
          heading={isLoading ? "loading..." : depot?.name ?? "Depot"}
          breadcrumbItems={[
            { name: "Depots", path: "/depots" },
            { name: depot ? depot.name : isLoading ? "loading..." : "" },
          ]}
        />

        {isLoading ? <LinearProgress /> : null}
        {depot ? (
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
                      href={`/depots/${query.depotId as string}/${route.path}`}
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

export default DepotPage;
