import prisma from "@/prisma";
import { UserCreateDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import { EMAIL_SERVICE, USER_SERVICE } from "@/config";

const generateVerificationCode = () => {
  // Get current timestamp in milliseconds
  const timestamp = new Date().getTime().toString();

  // Generate a random 2-digit number
  const randomNum = Math.floor(10 + Math.random() * 90); // Ensures 2-digit random number

  // Combine timestamp and random number and extract last 5 digits
  let code = (timestamp + randomNum).slice(-5);

  return code; //
};

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
        verified: true,
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

    const code = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        code: code,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
      },
    });

    await axios.post(`${EMAIL_SERVICE}/emails/send`, {
      recipient: newUser.email,
      subject: "Email Verification",
      body: `Your verification code is ${code}`,
      source: "user-registration",
    });

    res.status(201).json({
      message: "Please check your email for verification code",
      data: newUser,
    });

    return;
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
