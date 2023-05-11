import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Unstable_Grid2";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore } from "@/lib/store/stores";
import type { Customer } from "@/lib/types";
import { AxiosError } from "axios";

const CustomerPage = () => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);
  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", router.query.storeId, router.query.customerId],
    queryFn: async () => {
      const { data } = await axios.get<Customer>(
        `api/customers/${router.query.customerId as string}/?store=${
          router.query.storeId as string
        }&expand=balances`
      );
      return data;
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });

  return (
    <>
      <Head>
        <title>{customer?.name ?? "Customer"} | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/restocks`}
          heading={customer?.name ?? "Customer"}
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${router.query.storeId as string}`,
            },
            {
              name: "Customers",
              path: `/stores/${router.query.storeId as string}/customers`,
            },
            { name: customer?.name ?? "Customer" },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}></Grid>
            <Grid xs={12} md={7}>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 2,
                  flexDirection: "row-reverse",
                }}
              ></Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default CustomerPage;
