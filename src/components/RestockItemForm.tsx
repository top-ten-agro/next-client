import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { schema } from "@/lib/reducers/restockItems";
import type { Product } from "@/lib/types";
import type { RestockItem } from "@/lib/reducers/restockItems";

const RestockItemForm = ({
  products,
  items,
  addItem,
}: {
  products: Product[];
  addItem: (item: RestockItem) => void;
  items: RestockItem[];
}) => {
  const {
    control,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<RestockItem>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });
  const selectProduct = handleSubmit((data) => {
    reset();
    addItem({ product: data.product, quantity: data.quantity });
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
                onChange={(_, data) => onChange(data?.id)}
                getOptionLabel={(option) =>
                  `${option.name} ${option.pack_size}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product"
                    placeholder="Select a Product"
                    InputLabelProps={{
                      shrink: true,
                    }}
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
        <Grid xs={12}>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(+e.target.value)}
                label="Quantity"
                type="number"
                inputProps={{ min: 0 }}
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
              />
            )}
          />
        </Grid>
        <Grid xs={12} sx={{ textAlign: "right" }}>
          <Button type="submit" variant="text">
            Add Quantity
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RestockItemForm;
