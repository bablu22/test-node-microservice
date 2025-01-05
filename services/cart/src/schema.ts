import { z } from "zod";

export const CartItemsSchema = z.object({
  productId: z.string(),
  inventoryId: z.string(),
  quantity: z.number(),
});
