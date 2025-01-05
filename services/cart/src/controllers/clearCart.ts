import redis from "@/redis";
import { Request, Response, NextFunction } from "express";

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartSessionId = req.headers["x-cart-session-id"] as string;
    if (!cartSessionId) {
      res.status(400).json({ data: [] });
      return;
    }

    const existingCart = await redis.exists(`session:${cartSessionId}`);
    if (!existingCart) {
      delete req.headers["x-cart-session-id"];
      res.status(400).json({ data: [] });
      return;
    }

    // clear cart
    await redis.del(`cart:${cartSessionId}`);
    await redis.del(`session:${cartSessionId}`);
    delete req.headers["x-cart-session-id"];

    res.json({ message: "Cart cleared" });
    return;
  } catch (error) {
    next(error);
  }
};

export default clearCart;
