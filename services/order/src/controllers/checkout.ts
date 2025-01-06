import axios from "axios";
import { CartItemSchema, OrderSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import { CART_SERVICE, PRODUCT_SERVICE } from "@/config";
import { z } from "zod";
import prisma from "@/prisma";
import sendToQueue from "@/queue";

const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = OrderSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      });
      return;
    }

    // get the cart details
    const { data: cartData } = await axios.get(`${CART_SERVICE}/cart/me`, {
      headers: {
        "x-cart-session-id": parsedBody.data.cartSessionId,
      },
    });

    const cartItems = z.array(CartItemSchema).safeParse(cartData.items);
    if (!cartItems.success) {
      res.status(400).json({
        message: "Invalid cart data",
        errors: cartItems.error.errors,
      });
      return;
    }

    if (cartItems.data.length === 0) {
      res.status(400).json({
        message: "Cart is empty",
      });
      return;
    }

    // get the product details from the product service
    const productDetails = await Promise.all(
      cartItems.data.map(async (item) => {
        const { data: product } = await axios.get(
          `${PRODUCT_SERVICE}/products/${item.productId}`,
        );

        return {
          productId: product.id as string,
          productName: product.name as string,
          sku: product.sku as string,
          price: product.price as number,
          quantity: item.quantity,
          total: product.price * item.quantity,
        };
      }),
    );

    const subtotal = productDetails.reduce(
      (total, item) => total + item.total,
      0,
    );
    const tax = subtotal * 0.1;
    const grandTotal = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        userId: parsedBody.data.userId,
        userName: parsedBody.data.userName,
        userEmail: parsedBody.data.userEmail,
        subtotal,
        tax,
        grandTotal,
        orderItems: {
          create: productDetails.map((item) => ({
            ...item,
          })),
        },
      },
    });

    // send to queue
    sendToQueue("send-email", JSON.stringify(order));
    sendToQueue(
      "clear-cart",
      JSON.stringify({
        cartSessionId: parsedBody.data.cartSessionId,
      }),
    );

    res.status(201).json(order);
    return;
  } catch (error) {
    next(error);
  }
};

export default checkout;
