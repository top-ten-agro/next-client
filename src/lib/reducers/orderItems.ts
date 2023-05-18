import { z } from "zod";

export const schema = z.object({
  product: z.number().int(),
  quantity: z.number().int().min(1),
  rate: z.number().min(0),
});

export type OrderItem = z.infer<typeof schema>;

export interface SetItemsAction {
  type: "SET";
  payload: OrderItem[];
}

export interface AddItemAction {
  type: "ADD";
  payload: OrderItem;
}

export interface RemoveItemAction {
  type: "REMOVE";
  payload: OrderItem["product"];
}

export function orderItemsReducer(
  items: z.infer<typeof schema>[],
  action: AddItemAction | RemoveItemAction | SetItemsAction
) {
  switch (action.type) {
    case "ADD":
      if (action.payload.quantity < 1) return items;
      return [...items, action.payload];
    case "REMOVE":
      return items.filter((item) => item.product !== action.payload);
    case "SET":
      return action.payload;
  }
}
