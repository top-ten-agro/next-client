import { useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Product } from "@/lib/types";
import type { OrderItem } from "@/lib/reducers/orderItems";
import { toBdt } from "@/lib/formatter";

const OrderItemsTable = ({
  selected,
  products,
  removeItem,
  commission,
  immutable,
}: {
  products: Product[];
  selected: OrderItem[];
  removeItem: (id: number) => void;
  commission: number;
  immutable?: boolean;
}) => {
  const items = useMemo(() => {
    return selected.map((item) => {
      const product = products.find((product) => product.id === item.product);
      return {
        name: product?.name ?? "",
        pack_size: product?.pack_size ?? "",
        ...item,
      };
    });
  }, [selected, products]);
  const subtotal = useMemo(
    () => selected.reduce((acc, crr) => acc + crr.rate * crr.quantity, 0),
    [selected]
  );
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="products table">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="center">Quantity</TableCell>
            <TableCell align="right">Rate</TableCell>
            {immutable ? null : <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row, i) => (
            <TableRow
              key={row.product}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {i + 1}
              </TableCell>
              <TableCell component="th" scope="row">
                {row.name} {row.pack_size}
              </TableCell>
              <TableCell align="center">{row.quantity}</TableCell>
              <TableCell align="right">{toBdt(row.rate)}</TableCell>
              {immutable ? null : (
                <TableCell align="center">
                  <IconButton
                    size="small"
                    aria-label="remove from list"
                    onClick={() => removeItem(row.product)}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          {selected.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={immutable ? 3 : 4}
                sx={{ textAlign: "center", py: 2 }}
              >
                no product selected.
              </TableCell>
            </TableRow>
          ) : null}
          <TableRow>
            <TableCell colSpan={3} rowSpan={3} />
            <TableCell align="right">Subtotal</TableCell>
            <TableCell align="right">{toBdt(subtotal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="right">{`Comission (${commission}%)`}</TableCell>
            <TableCell align="right">
              {toBdt(-subtotal * (commission / 100))}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">
              {toBdt(subtotal * (1 - commission / 100))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderItemsTable;
