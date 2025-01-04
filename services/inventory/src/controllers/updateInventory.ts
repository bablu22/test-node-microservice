import prisma from "@/prisma";
import { InventoryUpdateDTOSchema } from "@/schema";
import { ActionType } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: {
        id: String(id),
      },
    });
    if (!inventory) {
      res.status(404).json({
        message: "Inventory not found",
      });
      return;
    }

    const parsedBody = InventoryUpdateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.errors,
      });
      return;
    }

    // find the last history
    const lastHistory = await prisma.history.findFirst({
      where: {
        inventoryId: inventory.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // calculate the new quantity
    let newQuantity = inventory.quantity;
    if (parsedBody.data.actionType === ActionType.IN) {
      newQuantity += parsedBody.data.quantity;
    } else if (parsedBody.data.actionType === ActionType.OUT) {
      newQuantity -= parsedBody.data.quantity;
    } else {
      res.status(400).json({
        message: "Invalid action",
      });
      return;
    }

    // update the inventory
    const updatedInventory = await prisma.inventory.update({
      where: {
        id: String(id),
      },
      data: {
        quantity: newQuantity,
        histories: {
          create: {
            quantityChanged: parsedBody.data.quantity,
            actionType: parsedBody.data.actionType,
            lastQuantity: inventory.quantity,
            newQuantity,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    res.status(200).json(updatedInventory);
  } catch (error) {
    next(error);
  }
};

export default updateInventory;
