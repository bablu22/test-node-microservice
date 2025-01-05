import prisma from "@/prisma";
import { UserCreateDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import { USER_SERVICE } from "@/config";

const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedBody = UserCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        error: parsedBody.error.errors,
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (existingUser) {
      res.status(400).json({
        error: "User already exists",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parsedBody.data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        ...parsedBody.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verified: true,
      },
    });

    // create the user profile by calling the user service
    await axios.post(`${USER_SERVICE}/users`, {
      authUserId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
