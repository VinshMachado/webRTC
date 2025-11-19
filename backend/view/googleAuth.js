import { Router } from "express";
import passport from "passport";

const GoogleAuthRouter = Router();

GoogleAuthRouter.get(
  "/login",
  passport.authenticate("google", { scope: ["profile"] })
);

GoogleAuthRouter.get(
  "/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

export default GoogleAuthRouter;
