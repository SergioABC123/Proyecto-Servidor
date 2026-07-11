// rutas de los usuarios
import { Router } from "express";
import { getMe, loginUser, registerUser } from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validatePassword } from "../middlewares/validatePassword.middleware";

const router = Router();

router.post('/register',validatePassword,registerUser);
router .post('/login',loginUser);
router.get('/me',authMiddleware, getMe );

export default router;