import { Router } from "express";
import googleVerify from "../controller/googleauth.js";

const GoogleAuthRouter = Router();

GoogleAuthRouter.post("/GetToken", googleVerify);

export default GoogleAuthRouter;
