import prisma from "@/prisma";
import { UserCreateDTOSchema } from "./../schema";
import { NextFunction, Request, Response } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = UserCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json(parsedBody.error);
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        authUserId: parsedBody.data.authUserId,
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await prisma.user.create({
      data: parsedBody.data,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export default createUser;
