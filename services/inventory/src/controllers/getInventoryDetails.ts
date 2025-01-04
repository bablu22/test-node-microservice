import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getInventoryDetails = async (
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
      include: {
        histories: {
          orderBy: {
            createdAt: "desc",
          },
        },
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

export default getInventoryDetails;
