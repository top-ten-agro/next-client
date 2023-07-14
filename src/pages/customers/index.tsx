import { useMemo, useState } from "react";
import Head from "next/head";
import dayjs from "dayjs";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PageToolbar from "@/components/PageToolbar";
import { useRouter } from "next/router";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import { useQuery } from "@tanstack/react-query";
import type { Order, Transaction } from "@/lib/types";
import MRT_Table from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";
import { toBdt } from "@/lib/formatter";

type DepotOrder = Order & {
  balance: Order["balance"] & { depot: { id: number; name: string } };
};
type DepotTransaction = Transaction & { depot: { id: number; name: string } };

const Customers = () => {
  const router = useRouter();
  const axios = useAxiosAuth();

  const [endDate, setEndDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(30, "days").format("YYYY-MM-DD")
  );
  const {
    data: orders,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery(["order-statement", startDate, endDate], async () => {
    const { data } = await axios.get<DepotOrder[]>(
      `api/orders/statement/?omit=items&expand=balance.customer,balance.depot,created_by&from=${startDate}&to=${endDate}`
    );

    return data;
  });
  const {
    data: transactions,
    isLoading: txnLoading,
    isError: txnError,
  } = useQuery(["trx-statement", startDate, endDate], async () => {
    const { data } = await axios.get<DepotTransaction[]>(
      `api/transactions/statement/?omit=items&expand=balance.customer,depot,created_by&from=${startDate}&to=${endDate}`
    );
    return data;
  });

  const balances = useMemo(() => {
    if (!orders || !transactions) return [];
    const balance: Record<
      number,
      {
        id: number;
        customer: { id: number; name: string };
        depot: { id: number; name: string };
        in: number;
        out: number;
      }
    > = {};

    orders.forEach((order) => {
      const item = balance[order.balance.id];
      if (item) {
        item.out += +order.total;
      }
      balance[order.balance.id] = {
        id: order.balance.id,
        customer: {
          id: order.balance.customer.id,
          name: order.balance.customer.name,
        },
        depot: order.balance.depot,
        in: 0,
        out: +order.total,
      };
    });
    transactions.forEach((txn) => {
      if (!txn.balance) return;
      const item = balance[txn.balance.id];
      if (item) {
        item.in += +txn.cash_in;
        item.out += +txn.cash_out;
      }
      balance[txn.balance.id] = {
        ...txn.balance,
        depot: txn.depot,
        in: +txn.cash_in,
        out: +txn.cash_out,
      };
    });
    return Object.values(balance);
  }, [orders, transactions]);
  const columns = useMemo<MRT_ColumnDef<(typeof balances)[0]>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "depot.name", header: "Depot" },
      { accessorKey: "customer.name", header: "Customer" },
      {
        accessorKey: "out",
        header: "Sales",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(cell.getValue<number>(), { decimal: 0 }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce((acc, row) => acc + row.getValue<number>("out"), 0);
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total, { decimal: 0 })}
            </Typography>
          );
        },
      },
      {
        accessorKey: "in",
        header: "Recovery",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(cell.getValue<number>(), { decimal: 0 }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce((acc, row) => acc + row.getValue<number>("in"), 0);
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total, { decimal: 0 })}
            </Typography>
          );
        },
      },
      {
        header: "Due",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) =>
          toBdt(row.getValue<number>("out") - row.getValue<number>("in"), {
            decimal: 0,
          }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce(
              (acc, row) =>
                acc + row.getValue<number>("out") - row.getValue<number>("in"),
              0
            );
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total, { decimal: 0 })}
            </Typography>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>Customers | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Customers Statement"
          breadcrumbItems={[{ name: "Customers" }]}
        />
        <Box sx={{ display: "flex", gap: 2, maxWidth: 480 }}>
          <TextField
            type="date"
            size="small"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Box>
        <Box sx={{ position: "relative", mt: 1 }}>
          <Box
            sx={{
              position: "absolute",
              overflowX: "auto",
              overflowY: "hidden",
              insetInline: 0,
            }}
          >
            <Box sx={{ position: "relative", mt: 1 }}>
              <MRT_Table
                columns={columns}
                data={balances}
                state={{ isLoading: orderLoading || txnLoading }}
                initialState={{
                  density: "compact",
                  sorting: [{ id: "id", desc: false }],
                }}
                muiTableBodyRowProps={({ row }) => ({
                  sx: { cursor: "pointer" },
                  onClick: () => {
                    console.log(row.getValue<number>("balance.depot.id"));
                    void router.push({
                      pathname: "/depots/[depotId]/customers/[balanceId]",
                      query: {
                        depotId: row.original.depot.id,
                        balanceId: row.original.id,
                      },
                    });
                  },
                })}
                muiToolbarAlertBannerProps={
                  txnError || orderError
                    ? { color: "error", children: "Error loading data" }
                    : undefined
                }
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Customers;
