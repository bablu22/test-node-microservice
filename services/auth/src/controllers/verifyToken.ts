import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "@/prisma";
import { accessTokenSchema } from "@/schema";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = accessTokenSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        error: parsedBody.error.errors,
      });
      return;
    }

    const { accessToken } = parsedBody.data;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string);

    const user = await prisma.user.findUnique({
      where: {
        id: (decoded as any).userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      res.status(400).json({
        error: "Invalid token",
      });
      return;
    }

    res.status(200).json({
      user,
    });

    return;
  } catch (error) {
    next(error);
  }
};

export default verifyToken;
