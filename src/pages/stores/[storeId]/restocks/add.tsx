import React from "react";
import Head from "next/head";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { useCurrentStore, useStoreRole } from "@/lib/store/stores";
import Alert from "@mui/material/Alert";
import { useRouter } from "next/router";
import PageToolbar from "@/components/PageToolbar";
import LinearProgress from "@mui/material/LinearProgress";

const AddReStock = () => {
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);
  const role = useStoreRole((state) => state.role);
  const isRoleLoading = useStoreRole((state) => state.isLoading);

  return (
    <>
      <Head>
        <title>Add Re-Stock | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/restocks`}
          heading="New Re-Stock"
          breadcrumbItems={[
            { name: "Stores", path: `/stores` },
            {
              name: store?.name ?? "store",
              path: `/stores/${store?.id ?? ""}`,
            },
            {
              name: "Re-Stocks",
              path: `/stores/${router.query.storeId as string}/restocks`,
            },
            { name: "Add" },
          ]}
        />

        {isRoleLoading ? (
          <LinearProgress />
        ) : role?.role === "MANAGER" ? (
          <Box></Box>
        ) : (
          <Alert severity="error">
            {"You don't have permission to add Re-Stock"}
          </Alert>
        )}
      </Container>
    </>
  );
};

export default AddReStock;
