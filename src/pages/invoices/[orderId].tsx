import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Unstable_Grid2";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import PageToolbar from "@/components/PageToolbar";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import Typography from "@mui/material/Typography";
import { toBdt } from "@/lib/formatter";
import type { Invoice } from "@/lib/types";
import GeneratePdf from "@/components/GenerateInvoice";

const InvoicePage = () => {
  const router = useRouter();
  const axios = useAxiosAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", "fetch-order", router.query.orderId],
    queryFn: async () => {
      if (typeof router.query.orderId !== "string") {
        throw new Error("Order ID not defined.");
      }
      const { data } = await axios.get<Invoice>(
        `api/orders/${router.query.orderId}/?expand=items.product,created_by,balance.customer`
      );
      return data;
    },
    onSuccess: ({ items, approved, id }) => {
      if (!approved) {
        return void router.push(
          `/depots/${router.query.depotId as string}/orders/${id}`
        );
      }
      if (!items) return;
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return void router.push("/404");
      }
    },
  });
  const subtotal =
    order?.items.reduce((acc, crr) => acc + +crr.rate * crr.quantity, 0) ?? 0;

  return (
    <>
      <Head>
        <title>Invoice #{order?.id} | TopTen</title>
      </Head>

      <Container sx={{ mt: 2 }}>
        <PageToolbar
          backHref={`/invoices`}
          heading={`Invoice #${order?.id ?? ""}`}
          breadcrumbItems={[
            {
              name: "Invoices",
              path: `/invoices`,
            },
            { name: `Invoice #${order?.id ?? ""}` },
          ]}
        />

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={2}>
            <Grid xs={12} md={5}>
              <List dense sx={{ mb: 2 }}>
                <ListItem sx={{ p: 0 }}>
                  <ListItemButton
                    LinkComponent={NextLink}
                    href={`/depots/${
                      router.query.depotId as string
                    }/customers/${order?.balance.id ?? ""}`}
                  >
                    <ListItemText
                      primary={"Customer"}
                      secondary={order?.balance.customer.name}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created at"}
                    secondary={dayjs(order?.created_at).format(
                      "DD/MM/YYYY HH:mm A"
                    )}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Address"}
                    secondary={order?.balance.customer.address}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={"Created by"}
                    secondary={order?.created_by.name}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              {order ? (
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="products table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="right">Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((row, i) => (
                        <TableRow
                          key={row.product.id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {i + 1}
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {row.product.name} {row.product.pack_size}
                          </TableCell>
                          <TableCell align="center">{row.quantity}</TableCell>
                          <TableCell align="right">
                            {toBdt(+row.rate)}
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow>
                        <TableCell colSpan={2} rowSpan={3} />
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="right">{toBdt(subtotal)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right">{`Comission (${order.commission}%)`}</TableCell>
                        <TableCell align="right">
                          {toBdt(-subtotal * (+order.commission / 100))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">
                          {toBdt(subtotal * (1 - +order.commission / 100))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : null}
              {order ? (
                <Box display={"flex"} justifyContent={"end"}>
                  <Paper sx={{ mt: 2, maxWidth: 400 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Total Sales
                            </TableCell>
                            <TableCell sx={{ textAlign: "right" }}>
                              {toBdt(+order.balance.sales)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Total Recovery
                            </TableCell>
                            <TableCell sx={{ textAlign: "right" }}>
                              {toBdt(+order.balance.cash_in)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Total Due
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: "bold", textAlign: "right" }}
                            >
                              {toBdt(
                                +order.balance.sales - +order.balance.cash_in
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              ) : null}

              {order ? (
                <Box
                  sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "end" }}
                >
                  <GeneratePdf invoice={order} subtotal={subtotal} />
                </Box>
              ) : null}
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default InvoicePage;
