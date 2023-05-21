import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import dayjs from "dayjs";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import PageToolbar from "@/components/PageToolbar";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MRT_Table from "material-react-table";
import { toBdt } from "@/lib/formatter";
import type { Transaction } from "@/lib/types";
import type { MRT_ColumnDef } from "material-react-table";
import Typography from "@mui/material/Typography";

type DepotTransaction = Transaction & { depot: { id: string; name: string } };

const TransactionsStatement = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const [endDate, setEndDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(30, "days").format("YYYY-MM-DD")
  );

  const {
    data: transactions,
    isLoading,
    isError,
  } = useQuery(["trx-statement", startDate, endDate], async () => {
    const { data } = await axios.get<DepotTransaction[]>(
      `api/transactions/statement/?omit=items&expand=balance.customer,depot,created_by&from=${startDate}&to=${endDate}`
    );
    return data;
  });

  const sum = useMemo(
    () =>
      transactions?.reduce(
        ({ cash_in, cash_out }, crr) => ({
          cash_in: cash_in + Number(crr.cash_in),
          cash_out: cash_out + Number(crr.cash_out),
        }),
        { cash_in: 0, cash_out: 0 }
      ) ?? { cash_in: 0, cash_out: 0 },
    [transactions]
  );

  const columns = useMemo<MRT_ColumnDef<DepotTransaction>[]>(
    () => [
      { accessorKey: "id", header: "#", size: 100 },
      { accessorKey: "title", header: "Title" },
      { accessorKey: "depot.name", header: "Depot" },
      { accessorKey: "created_by.email", header: "Officer" },
      {
        accessorKey: "balance.customer.name",
        header: "Customer",
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },
      {
        accessorKey: "cash_in",
        header: "Cash In",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: () => (
          <Typography fontWeight="bold" textAlign="right">
            {toBdt(sum.cash_in, { decimal: 0 })}
          </Typography>
        ),
      },
      {
        accessorKey: "cash_out",
        header: "Cash Out",
        size: 200,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: () => (
          <Typography fontWeight="bold" textAlign="right">
            {toBdt(sum.cash_out, { decimal: 0 })}
          </Typography>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        enableColumnFilter: false,
        enableGlobalFilter: false,
        Cell: ({ cell }) => dayjs(cell.getValue<string>()).format("DD/MM/YYYY"),
      },
    ],
    [sum.cash_in, sum.cash_out]
  );

  return (
    <>
      <Head>
        <title>Transactions Statement | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Transactions Statement"
          breadcrumbItems={[{ name: "Transactions Statement" }]}
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
            <MRT_Table<DepotTransaction>
              columns={columns}
              data={transactions ?? []}
              state={{ isLoading }}
              initialState={{
                density: "compact",
                columnVisibility: { title: false },
                sorting: [{ id: "created_at", desc: true }],
              }}
              muiTableBodyRowProps={({ row }) => ({
                sx: { cursor: "pointer" },
                onClick: () => {
                  console.log(row.getValue<number>("balance.depot.id"));
                  void router.push({
                    pathname: "/depots/[depotId]/transactions/[txnId]",
                    query: {
                      depotId: row.original.depot.id,
                      txnId: row.getValue<number>("id"),
                    },
                  });
                },
              })}
              muiToolbarAlertBannerProps={
                isError
                  ? { color: "error", children: "Error loading data" }
                  : undefined
              }
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default TransactionsStatement;
