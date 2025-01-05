import prisma from "@/prisma";
import { UserLoginDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { AccountStatus, LoginAttemptStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

type LoginHistory = {
  userId: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  attempt: LoginAttemptStatus;
};

const createLoginHistory = async (info: LoginHistory) => {
  await prisma.loginHistory.create({
    data: {
      userId: info.userId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      attempt: info.attempt,
    },
  });
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "";
    const userAgent = req.headers["user-agent"] || "";

    const parsedBody = UserLoginDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        error: parsedBody.error.errors,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      res.status(400).json({
        error: "Invalid credentials",
      });
      return;
    }

    const isMatch = await bcrypt.compare(
      parsedBody.data.password,
      user.password,
    );

    if (!isMatch) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      res.status(400).json({
        error: "Invalid credentials",
      });
      return;
    }

    if (!user.verified) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      res.status(400).json({
        error: "User is not verified",
      });
      return;
    }

    if (user.status !== AccountStatus.ACTIVE) {
      await createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        attempt: "FAILED",
      });

      res.status(400).json({
        error: "User account is not active",
      });
      return;
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "2h",
      },
    );

    await createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      attempt: "SUCCESS",
    });

    res.status(200).json({
      accessToken,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export default userLogin;
