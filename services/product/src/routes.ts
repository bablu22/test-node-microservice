import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductDetails,
  updateProduct,
} from "./controllers";

const router = Router();

router.get("/products/:id", getProductDetails);
router.put("/products/:id", updateProduct);
router.get("/products", getProducts);
router.post("/products", createProduct);

export default router;
