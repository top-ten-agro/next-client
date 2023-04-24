import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import MuiBreadcrumbs from "@/components/MuiBreadcrumbs";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import type { AxiosInstance } from "axios";
import type { Store } from "@/lib/types";

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
        {store ? <Box>{store.name}</Box> : null}
      </Container>
    </>
  );
};

export default StorePage;
