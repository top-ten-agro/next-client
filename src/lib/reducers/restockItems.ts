import { z } from "zod";

export const schema = z.object({
  product: z.number().int(),
  quantity: z.number().int().min(0),
});

export type RestockItem = z.infer<typeof schema>;

export interface SetItemsAction {
  type: "SET";
  payload: RestockItem[];
}

export interface AddItemAction {
  type: "ADD";
  payload: RestockItem;
}

export interface RemoveItemAction {
  type: "REMOVE";
  payload: RestockItem["product"];
}

export function restockItemsReducer(
  items: z.infer<typeof schema>[],
  action: AddItemAction | RemoveItemAction | SetItemsAction
) {
  switch (action.type) {
    case "ADD":
      if (action.payload.quantity < 0) return items;
      return [...items, action.payload];
    case "REMOVE":
      return items.filter((item) => item.product !== action.payload);
    case "SET":
      return action.payload;
  }
}
