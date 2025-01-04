import { Router } from "express";
import {
  createInventory,
  updateInventory,
  getInventoryById,
  getInventoryDetails,
} from "./controllers";

const router = Router();

router.get("/inventories/:id/details", getInventoryDetails);
router.get("/inventories/:id", getInventoryById);
router.put("/inventories/:id", updateInventory);
router.post("/inventories", createInventory);

export default router;
