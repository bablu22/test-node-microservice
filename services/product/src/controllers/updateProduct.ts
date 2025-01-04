import prisma from "@/prisma";
import { ProductUpdateDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const parsedBody = ProductUpdateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      });
      return;
    }

    // check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: String(id),
      },
    });

    if (!existingProduct) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: String(id),
      },
      data: parsedBody.data,
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export default updateProduct;
