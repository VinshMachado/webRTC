import express from "express";
import passport from "passport";
import session from "express-session";
import GoogleAuthRouter from "./view/googleAuth.js";
import "./controller/googleauth.js"; // make sure strategy loads

const app = express();
const port = 8080;

app.use(express.json());

app.use(
  session({
    secret: "SECRET_KEY",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", GoogleAuthRouter);

app.listen(port, () => {
  console.log("server running on port:", port);
});
