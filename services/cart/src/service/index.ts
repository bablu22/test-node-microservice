import { INVENTORY_SERVICE } from "@/config";
import redis from "@/redis";
import axios from "axios";

export const clearCart = async (id: string) => {
  try {
    const data = await redis.hgetall(`cart:${id}`);
    if (Object.keys(data).length === 0) return;

    const items = Object.keys(data).map((key) => {
      const { quantity, inventoryId } = JSON.parse(data[key]) as {
        inventoryId: string;
        quantity: number;
      };

      return { inventoryId, quantity, productId: key };
    });

    Promise.all(
      items.map((item) => {
        return axios.put(
          `${INVENTORY_SERVICE}/inventories/${item.inventoryId}/release`,
          { quantity: item.quantity, actionType: "IN" },
        );
      }),
    );

    await redis.del(`cart:${id}`);
  } catch (error) {
    throw new Error(error as any);
  }
};
