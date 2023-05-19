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
import { useEffect } from "react";

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
    watch,
    handleSubmit,
  } = useForm<OrderItem>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, rate: 0 },
  });
  const productId = watch("product");

  useEffect(() => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      reset();
      return;
    }
    setValue("quantity", 1);
    setValue("rate", +product.price);
  }, [productId, products, setValue, reset]);

  const selectProduct = handleSubmit((data) => {
    addItem(data);
    reset();
  });
  return (
    <Box component="form" onSubmit={(e) => void selectProduct(e)}>
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Controller
            name="product"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <Autocomplete
                {...field}
                value={products?.find(({ id }) => id === value) ?? null}
                options={products.filter(
                  (product) =>
                    !items.find((item) => item.product === product.id)
                )}
                onChange={(_, data) => onChange(data?.id)}
                getOptionLabel={(option) =>
                  `${option.name} ${option.pack_size}`
                }
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
          />
        </Grid>
        <Grid xs={6}>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Quantity"
                type="number"
                onChange={(e) => field.onChange(+e.target.value)}
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
                label="Rate"
                type="number"
                onChange={(e) => field.onChange(+e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                error={!!errors.rate}
                helperText={errors.rate?.message}
                InputLabelProps={{ shrink: true }}
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
