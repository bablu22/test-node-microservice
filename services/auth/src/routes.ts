import { Router } from "express";
import {
  userLogin,
  userRegistration,
  verifyEmail,
  verifyToken,
} from "./controllers";

const router = Router();

router.post("/auth/register", userRegistration);
router.post("/auth/login", userLogin);
router.post("/auth/verify-token", verifyToken);
router.post("/auth/verify-email", verifyEmail);

export default router;
