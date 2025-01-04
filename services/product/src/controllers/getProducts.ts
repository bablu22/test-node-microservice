import { Request, Response, NextFunction } from "express";
import { prisma } from "@/prisma";

const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        status: true,
      },
    });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export default getProducts;
