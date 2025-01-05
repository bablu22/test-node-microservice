import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "@/prisma";
import { EmailVerifyDTOSchema } from "@/schema";
import { EMAIL_SERVICE } from "@/config";
import axios from "axios";

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = EmailVerifyDTOSchema.safeParse(req.body);
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
        error: "User not found",
      });
      return;
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        code: parsedBody.data.code,
        userId: user.id,
      },
    });

    if (!verificationCode) {
      res.status(400).json({
        error: "Invalid verification code",
      });
      return;
    }

    // if the code is expired
    if (verificationCode.expiresAt < new Date()) {
      res.status(400).json({
        error: "Verification code expired",
      });
      return;
    }

    // update the user to be verified
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verified: true,
        status: "ACTIVE",
      },
    });

    // update the verification code to be used
    await prisma.verificationCode.update({
      where: {
        id: verificationCode.id,
      },
      data: {
        status: "USED",
        verifiedAt: new Date(),
      },
    });

    // send success email
    await axios.post(`${EMAIL_SERVICE}/emails/send`, {
      recipient: user.email,
      subject: "Email Verified",
      body: "Your email has been verified",
      source: "email-verification",
    });

    res.status(200).json({
      message: "Email verified successfully",
    });

    return;
  } catch (error) {
    next(error);
  }
};

export default verifyEmail;
