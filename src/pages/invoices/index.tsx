import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import dayjs from "dayjs";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PageToolbar from "@/components/PageToolbar";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import MRT_Table from "material-react-table";
import { toBdt } from "@/lib/formatter";
import type { Order } from "@/lib/types";
import type { MRT_ColumnDef } from "material-react-table";

type DepotOrder = Order & {
  balance: Order["balance"] & { depot: { id: string; name: string } };
};

const OrdersStatement = () => {
  const router = useRouter();
  const axios = useAxiosAuth();
  const [endDate, setEndDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(30, "days").format("YYYY-MM-DD")
  );

  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery(["order-statement", startDate, endDate], async () => {
    const { data } = await axios.get<DepotOrder[]>(
      `api/orders/statement/?omit=items&expand=balance.customer,balance.depot,created_by&from=${startDate}&to=${endDate}`
    );
    return data;
  });

  const columns = useMemo<MRT_ColumnDef<DepotOrder>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Created At",
        enableColumnFilter: false,
        enableGlobalFilter: false,
        Cell: ({ cell }) => dayjs(cell.getValue<string>()).format("DD/MM/YYYY"),
      },
      { accessorKey: "id", header: "ID" },
      { accessorKey: "balance.customer.name", header: "Customer" },
      { accessorKey: "balance.customer.address", header: "Address" },

      {
        accessorKey: "total",
        header: "Total",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.reduce(
              (acc, row) => acc + parseFloat(row.getValue<string>("total")),
              0
            );
          return (
            <Typography fontWeight="bold" textAlign="right">
              {toBdt(total, { decimal: 0 })}
            </Typography>
          );
        },
      },
      { accessorKey: "created_by.name", header: "Officer" },
      { accessorKey: "balance.depot.name", header: "Depot" },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>Orders Statement | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Orders Statement"
          breadcrumbItems={[{ name: "Orders Statement" }]}
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
            <MRT_Table<DepotOrder>
              columns={columns}
              data={orders ?? []}
              state={{ isLoading }}
              initialState={{
                density: "compact",
                sorting: [{ id: "created_at", desc: true }],
                columnVisibility: { "balance.depot.name": false },
              }}
              muiTableBodyRowProps={({ row }) => ({
                sx: { cursor: "pointer" },
                onClick: () => {
                  console.log(row.getValue<number>("balance.depot.id"));
                  void router.push({
                    pathname: "/invoices/[orderId]",
                    query: {
                      orderId: row.getValue<number>("id"),
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

export default OrdersStatement;
