import amqp from "amqplib";
import { defaultSender, QUEUE_URL, transporter } from "./config";
import prisma from "./prisma";

const receiveFromQueue = async (
  queue: string,
  callback: (msg: amqp.ConsumeMessage | null) => void,
) => {
  const connection = await amqp.connect(QUEUE_URL);
  const channel = await connection.createChannel();

  const exchange = "order";
  await channel.assertExchange(exchange, "direct", { durable: false });

  const q = await channel.assertQueue(queue, { exclusive: false });
  await channel.bindQueue(q.queue, exchange, queue);

  channel.consume(
    q.queue,
    (msg) => {
      callback(msg);
    },
    { noAck: true },
  );
};

receiveFromQueue("send-email", async (msg) => {
  const parsedBody = JSON.parse(msg?.content.toString() || "");
  const { userEmail, grandTotal, id } = parsedBody;
  const from = defaultSender;
  const subject = "Order Confirmation";
  const body = `Thank you for your order. Your order id is ${id}. Your order total is $${grandTotal}`;

  const emailOption = {
    from,
    to: userEmail,
    subject,
    text: body,
  };

  // send the email
  const { rejected } = await transporter.sendMail(emailOption);
  if (rejected.length) {
    console.log("Email rejected: ", rejected);
    return;
  }

  await prisma.email.create({
    data: {
      sender: from,
      recipient: userEmail,
      subject: "Order Confirmation",
      body,
      source: "OrderConfirmation",
      sendAt: new Date(),
    },
  });
  console.log("Email sent");
});
