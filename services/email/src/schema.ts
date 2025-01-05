import { z } from "zod";

export const EmailCreateDTOSchema = z.object({
  recipient: z.string().email(),
  sender: z.string().email().optional(),
  subject: z.string(),
  body: z.string(),
  source: z.string(),
});
