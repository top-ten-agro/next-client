import Head from "next/head";
import NextLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import MuiBreadcrumbs from "@/components/MuiBreadcrumbs";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import type { AxiosInstance } from "axios";
import type { ListResponse, Store } from "@/lib/types";

const fetchStores = async (axios: AxiosInstance) => {
  const { data } = await axios
    .get<ListResponse<Store>>("api/stores/")
    .catch((error) => {
      throw error;
    });
  return data;
};

const Stores = () => {
  const axios = useAxiosAuth();
  const {
    data: storesRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: () => fetchStores(axios),
  });

  return (
    <>
      <Head>
        <title>Stores | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <MuiBreadcrumbs items={[{ name: "Stores" }]} />
        <Typography fontSize={36} fontWeight={"bold"} mb={2}>
          Stores
        </Typography>
        {isLoading ? <LinearProgress /> : null}
        {isError ? (
          <Typography color={"error"}>
            {error instanceof Error ? error.message : "An error occured."}
          </Typography>
        ) : null}
        {storesRes ? (
          <Grid container spacing={2}>
            {storesRes.count === 0 ? (
              <Grid xs={12}>
                <Card>
                  <CardContent>
                    <Typography>No stores available</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
            {storesRes.results.map((store) => (
              <Grid key={store.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardActionArea
                    LinkComponent={NextLink}
                    href={`/stores/${store.id}`}
                  >
                    <CardContent>
                      <Typography fontSize={18} fontWeight={"bold"}>
                        {store.name}
                      </Typography>
                      <Typography>{store.address}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Container>
    </>
  );
};

export default Stores;
