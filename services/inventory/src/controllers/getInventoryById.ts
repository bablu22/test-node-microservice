import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getInventoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: String(id),
      },
      select: {
        id: true,
        sku: true,
        quantity: true,
      },
    });
    if (!inventory) {
      res.status(404).json({
        message: "Inventory not found",
      });
      return;
    }

    res.json({
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

export default getInventoryById;
