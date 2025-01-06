import amqp from "amqplib";
import { QUEUE_URL } from "./config";
import redis from "./redis";

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

receiveFromQueue("clear-cart", (msg) => {
  const parseMessage = JSON.parse(msg?.content.toString() || "");
  const cartSessionId = parseMessage.cartSessionId;
  redis.del(`session:${cartSessionId}`);
  redis.del(`cart:${cartSessionId}`);
  console.log(`Clear cart session: ${cartSessionId}`);
});
