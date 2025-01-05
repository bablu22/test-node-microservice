import { Router } from "express";
import { userLogin, userRegistration, verifyToken } from "./controllers";

const router = Router();

router.post("/auth/register", userRegistration);
router.post("/auth/login", userLogin);
router.post("/auth/verify-token", verifyToken);

export default router;
