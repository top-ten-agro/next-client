import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Unstable_Grid2";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useCurrentStore } from "@/lib/store/stores";
import { AxiosError } from "axios";
import type { CustomerBalance } from "@/lib/types";
import { toBdt } from "@/lib/formatter";

const CustomerPage = () => {
  const axios = useAxiosAuth();
  const router = useRouter();
  const store = useCurrentStore((state) => state.store);
  const [value, setValue] = useState("1");
  const { data: balance, isLoading } = useQuery({
    queryKey: ["balance", router.query.balanceId],
    queryFn: async () => {
      const { data } = await axios.get<CustomerBalance>(
        `api/balances/${router.query.balanceId as string}/`
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
        <title>{balance?.customer.name ?? "Customer"} | TopTen</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/stores/${router.query.storeId as string}/customers`}
          heading={balance?.customer.name ?? "Customer"}
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
            { name: balance?.customer.name ?? "Customer" },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : balance ? (
          <Box>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <List>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocalPhoneIcon />
                    </ListItemIcon>
                    <ListItemText>{balance.customer.phone}</ListItemText>
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocationOnIcon />
                    </ListItemIcon>
                    <ListItemText>{balance.customer.address}</ListItemText>
                  </ListItem>
                </List>
              </Grid>
              <Grid xs={12} md={6}>
                <BalanceTable balance={balance} />
              </Grid>
            </Grid>

            <Box sx={{ height: 20 }} />
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList
                  onChange={(e, val) => setValue(val as string)}
                  aria-label="lab API tabs example"
                >
                  <Tab label="Orders" value="1" />
                  <Tab label="Transactions" value="2" />
                </TabList>
              </Box>
              <TabPanel value="1">Item One</TabPanel>
              <TabPanel value="2">Item Two</TabPanel>
            </TabContext>
          </Box>
        ) : null}
      </Container>
    </>
  );
};

export default CustomerPage;

const BalanceTable = ({ balance }: { balance: CustomerBalance }) => (
  <TableContainer component={Paper} sx={{ maxWidth: 320 }}>
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell component="th" scope="row">
            Sales
          </TableCell>
          <TableCell align="right">{toBdt(+balance.revenue)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Paid
          </TableCell>
          <TableCell align="right">{toBdt(+balance.cash_in)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Due
          </TableCell>
          <TableCell align="right">
            {toBdt(+balance.revenue - +balance.cash_in)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);
