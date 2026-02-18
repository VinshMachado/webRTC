import express from "express";
import GoogleAuthRouter from "./view/googleAuth.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRouter from "./view/user.js";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import InitalizeSocket from "./controller/socket.js";
dotenv.config();
const app = express();
const port = 8080;

// ------------------data  base connection//

mongoose
  .connect(
    "mongodb+srv://machadovinish_db_user:pewdiepie@cluster0.htlwlju.mongodb.net/myDatabase?retryWrites=true&w=majority",
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// -------------------making http server
const server = http.createServer(app);

//--------------------Middlewares
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(cookieParser());
app.use(express.json());

//-------------------- Routers
app.use("/auth", GoogleAuthRouter);
app.use("/user", userRouter);

InitalizeSocket(server);

//------------------------Listen

server.listen(port, () => {
  console.log("server running on port:", port);
});
