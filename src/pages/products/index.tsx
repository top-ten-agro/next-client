import { useMemo, useState } from "react";
import Head from "next/head";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import PageToolbar from "@/components/PageToolbar";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import type { ListResponse, Product } from "@/lib/types";
import MRT_Table from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";
import { toBdt } from "@/lib/formatter";

const Products = () => {
  const axios = useAxiosAuth();
  const [endDate, setEndDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(30, "days").format("YYYY-MM-DD")
  );

  const { data: products, isLoading } = useQuery(["products"], async () => {
    const { data } = await axios.get<ListResponse<Product>>(
      "api/products/?per_page=999"
    );

    return data.results;
  });

  const { data: statements, isLoading: statementsLoading } = useQuery(
    ["statement", startDate, endDate],
    async () => {
      const { data } = await axios.get<
        Array<{ product: number; total: number }>
      >(`api/products/statement/?from=${startDate}&to=${endDate}`);
      console.log(data);
      return data;
    }
  );

  const productsStatement = useMemo(
    () =>
      products?.map((product) => ({
        ...product,
        total: statements?.find((item) => item.product === product.id)?.total,
      })),
    [products, statements]
  );

  const columns = useMemo<MRT_ColumnDef<Product & { total?: number }>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "pack_size", header: "Pack Size" },
      {
        accessorKey: "total",
        header: "Units Sold",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }) => cell.getValue<string>() ?? "0",
      },
      {
        accessorKey: "price",
        header: "Price",
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => toBdt(+cell.getValue<string>()),
      },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>Products | Top Ten</title>
      </Head>
      <Container sx={{ mt: 2 }}>
        <PageToolbar
          heading="Products Statement"
          breadcrumbItems={[{ name: "Products" }]}
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
            <MRT_Table
              columns={columns}
              data={productsStatement ?? []}
              state={{ isLoading: isLoading || statementsLoading }}
              initialState={{ density: "compact" }}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Products;
