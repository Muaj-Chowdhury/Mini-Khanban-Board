import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", auth(), authController.getProfile);

export const authRoutes = router;
