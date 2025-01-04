import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";
import axios from "axios";
import { INVENTORY_URL } from "@/config";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: {
        id: String(id),
      },
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.inventoryId === null) {
      const { data: inventory } = await axios.post(
        `${INVENTORY_URL}/inventories`,
        {
          productId: product.id,
          sku: product.sku,
        },
      );

      await prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          inventoryId: inventory.id,
        },
      });

      res.status(200).json({
        ...product,
        inventoryId: inventory.id,
        stock: inventory.quantity || 0,
        stockStatus: inventory.quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
      });
      return;
    }

    const { data: inventory } = await axios.get(
      `${INVENTORY_URL}/inventories/${product.inventoryId}/details`,
    );
    res.status(200).json({
      ...product,
      stock: inventory.data.quantity || 0,
      stockStatus: inventory.data.quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
    });
  } catch (error) {
    next(error);
  }
};

export default getProductDetails;
