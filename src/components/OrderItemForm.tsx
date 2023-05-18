import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { schema } from "@/lib/reducers/orderItems";
import type { Product } from "@/lib/types";
import type { OrderItem } from "@/lib/reducers/orderItems";

const OrderItemForm = ({
  products,
  items,
  addItem,
}: {
  products: Product[];
  addItem: (item: OrderItem) => void;
  items: OrderItem[];
}) => {
  const {
    control,
    formState: { errors },
    reset,
    setValue,
    handleSubmit,
  } = useForm<OrderItem>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });
  const selectProduct = handleSubmit((data) => {
    reset();
    addItem(data);
  });
  return (
    <Box component="form" onSubmit={(e) => void selectProduct(e)}>
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Controller
            render={({ field: { onChange, value, ...field } }) => (
              <Autocomplete
                {...field}
                value={products?.find(({ id }) => id === value) ?? null}
                options={products.filter(
                  (product) =>
                    !items.find((item) => item.product === product.id)
                )}
                onChange={(_, data) => {
                  setValue("rate", data ? Number(data.price) : 0);
                  onChange(data?.id);
                }}
                groupBy={(option) => option.name}
                getOptionLabel={(option) => option.pack_size}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product"
                    placeholder="Select a Product"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.product}
                    helperText={errors.product?.message}
                  />
                )}
              />
            )}
            name="product"
            control={control}
          />
        </Grid>
        <Grid xs={6}>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(+e.target.value)}
                label="Quantity"
                type="number"
                inputProps={{ min: 1 }}
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
              />
            )}
          />
        </Grid>
        <Grid xs={6}>
          <Controller
            name="rate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(+e.target.value)}
                label="Rate"
                type="number"
                inputProps={{ min: 0 }}
                error={!!errors.rate}
                helperText={errors.rate?.message}
              />
            )}
          />
        </Grid>
        <Grid xs={12} sx={{ textAlign: "right" }}>
          <Button type="submit" variant="text">
            Add Product
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderItemForm;
