import Head from "next/head";
import NextLink from "next/link";
import { useQuery } from "@tanstack/react-query";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import PageToolbar from "@/components/PageToolbar";
import type { AxiosInstance } from "axios";
import type { ListResponse, Depot } from "@/lib/types";

const fetchDepots = async (axios: AxiosInstance) => {
  const { data } = await axios
    .get<ListResponse<Depot>>("api/depots/")
    .catch((error) => {
      throw error;
    });
  return data;
};

const Depots = () => {
  const axios = useAxiosAuth();
  const {
    data: depotsRes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["depots"],
    queryFn: () => fetchDepots(axios),
  });

  return (
    <>
      <Head>
        <title>Depots | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref="/"
          heading="Depots"
          breadcrumbItems={[{ name: "Depots" }]}
        />

        {isLoading ? <LinearProgress /> : null}
        {isError ? (
          <Typography color={"error"}>
            {error instanceof Error ? error.message : "An error occured."}
          </Typography>
        ) : null}
        {depotsRes ? (
          <Grid container spacing={2}>
            {depotsRes.count === 0 ? (
              <Grid xs={12}>
                <Card>
                  <CardContent>
                    <Typography>No depots available</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : null}
            {depotsRes.results.map((depot) => (
              <Grid key={depot.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardActionArea
                    LinkComponent={NextLink}
                    href={`/depots/${depot.id}`}
                  >
                    <CardContent>
                      <Typography fontSize={18} fontWeight={"bold"}>
                        {depot.name}
                      </Typography>
                      <Typography>{depot.address}</Typography>
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

export default Depots;
