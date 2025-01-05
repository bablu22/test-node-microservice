import { z } from "zod";

export const UserCreateDTOSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(255),
  name: z.string().min(3).max(255),
});

export const UserLoginDTOSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(255),
});

export const accessTokenSchema = z.object({
  accessToken: z.string(),
});
