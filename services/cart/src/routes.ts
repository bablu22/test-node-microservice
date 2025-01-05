import { Router } from "express";
import { addToCart, clearCart, getMyCart } from "./controllers";

const router = Router();

router.post("/cart/add-to-cart", addToCart);
router.get("/cart/me", getMyCart);
router.get("/cart/clear", clearCart);

export default router;
