import { Router } from "express";
import checkout from "./controllers/checkout";
import getOrderById from "./controllers/getOrderById";
import getOrders from "./controllers/getOrders";

const router = Router();

router.post("/orders/checkout", checkout);
router.get("/orders/:id", getOrderById);
router.get("/orders", getOrders);

export default router;
