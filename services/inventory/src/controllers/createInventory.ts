import prisma from "@/prisma";
import { InventoryCreateDTOSchema } from "@/schema";
import { ActionType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsedBody = InventoryCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.errors,
      });
      return;
    }

    const inventory = await prisma.inventory.create({
      data: {
        ...parsedBody.data,
        histories: {
          create: {
            actionType: ActionType.IN,
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: 0,
            newQuantity: parsedBody.data.quantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    res.status(201).json(inventory);
  } catch (error) {
    next(error);
  }
};

export default createInventory;
