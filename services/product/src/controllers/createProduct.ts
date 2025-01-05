import prisma from "@/prisma";
import { ProductCreateDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { INVENTORY_URL } from "@/config";

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      });
      return;
    }

    // check if product with sku already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: parsedBody.data.sku,
      },
    });

    if (existingProduct) {
      res.status(400).json({
        message: "Product with SKU already exists",
      });
      return;
    }

    const product = await prisma.product.create({
      data: parsedBody.data,
    });

    // create inventory record for the product
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

    res.status(201).json({
      ...product,
      inventoryId: inventory.id,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export default createProduct;
