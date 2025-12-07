import { Router } from "express";
import getUserDetails from "../controller/UserControls.js";
import authMiddleware from "../controller/auth.js";
const userRouter = Router();

userRouter.get("/Details", authMiddleware, getUserDetails);

export default userRouter;
