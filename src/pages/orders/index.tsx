import { useRouter } from "next/router";
import { useMemo, useState } from "react";
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
  const sumTotal = useMemo(() => {
    return orders?.reduce((acc, crr) => acc + Number(crr.total), 0) ?? 0;
  }, [orders]);
  const columns = useMemo<MRT_ColumnDef<DepotOrder>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "balance.depot.name", header: "Depot" },
      { accessorKey: "balance.customer.name", header: "Customer" },
      { accessorKey: "created_by.email", header: "Officer" },
      {
        accessorKey: "total",
        header: "Total",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>(), { decimal: 0 }),
        Footer: () => (
          <Typography fontWeight="bold" textAlign="right">
            {toBdt(sumTotal, { decimal: 0 })}
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
    [sumTotal]
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
              }}
              muiTableBodyRowProps={({ row }) => ({
                sx: { cursor: "pointer" },
                onClick: () => {
                  console.log(row.getValue<number>("balance.depot.id"));
                  void router.push({
                    pathname: "/depots/[depotId]/orders/[orderId]",
                    query: {
                      depotId: row.original.balance.depot.id,
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
