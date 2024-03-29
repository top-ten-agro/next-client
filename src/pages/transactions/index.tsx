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

  const columns = useMemo<MRT_ColumnDef<DepotTransaction>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        size: 40,
        enableColumnActions: false,
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        enableColumnFilter: false,
        enableGlobalFilter: false,
        Cell: ({ cell }) => dayjs(cell.getValue<string>()).format("DD/MM/YYYY"),
        size: 100,
        enableColumnActions: false,
      },
      { accessorKey: "title", header: "Title" },

      {
        accessorKey: "balance.customer.name",
        header: "Customer",
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },
      {
        accessorKey: "balance.customer.address",
        header: "Address",
        Cell: ({ cell }) => cell.getValue<string>() ?? "-",
      },

      {
        accessorKey: "cash_in",
        header: "Recovery",
        muiTableHeadCellProps: { sx: { pr: 3 }, align: "right" },
        muiTableBodyCellProps: { sx: { pr: 3 }, align: "right" },
        muiTableFooterCellProps: { sx: { pr: 3 } },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce(
              (acc, row) => acc + parseFloat(row.getValue<string>("cash_in")),
              0
            );
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total ?? 0, { decimal: 0 })}
            </Typography>
          );
        },
      },
      {
        accessorKey: "cash_out",
        header: "Cash Out",
        size: 200,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce(
              (acc, row) => acc + parseFloat(row.getValue<string>("cash_out")),
              0
            );
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total ?? 0, { decimal: 0 })}
            </Typography>
          );
        },
      },
      { accessorKey: "created_by.name", header: "Officer" },
      { accessorKey: "depot.name", header: "Depot" },
    ],
    []
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
                columnVisibility: {
                  title: false,
                  "depot.name": false,
                  cash_out:
                    transactions?.some((item) => +item.cash_out > 0) ?? false,
                },
                sorting: [{ id: "created_at", desc: true }],
              }}
              muiTableBodyRowProps={({ row }) => ({
                sx: { cursor: "pointer" },
                onClick: () => {
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
