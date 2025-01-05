import prisma from "@/prisma";
import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

/**
 * Get a user by their id or authUserId
 * field=authUserId|id
 * @default field=id
 */

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const field = req.query.field as string;
    let user: User | null = null;

    if (field === "authUserId") {
      user = await prisma.user.findFirst({
        where: {
          authUserId: id,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: {
          authUserId: id,
        },
      });
    }

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export default getUserById;
