import { defaultSender, transporter } from "@/config";
import prisma from "@/prisma";
import { EmailCreateDTOSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = EmailCreateDTOSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      });
      return;
    }

    const { sender, recipient, subject, body, source } = parsedBody.data;
    const from = sender || defaultSender;
    const emailData = {
      from,
      to: recipient,
      subject,
      text: body,
    };

    // Send email
    const { rejected } = await transporter.sendMail(emailData);

    if (rejected.length) {
      res.status(400).json({
        message: "Invalid recipient",
        errors: rejected,
      });
      return;
    }

    await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
        sendAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Email sent successfully",
    });

    return;
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
