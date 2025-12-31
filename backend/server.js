import express from "express";
import GoogleAuthRouter from "./view/googleAuth.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRouter from "./view/user.js";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
dotenv.config();
const app = express();
const port = 8080;

// ------------------data base connection//

mongoose
  .connect(
    "mongodb+srv://machadovinish_db_user:pewdiepie@cluster0.htlwlju.mongodb.net/myDatabase?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// -------------------making http server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
//--------------------Middlewares
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(cookieParser());
app.use(express.json());

//-------------------- Routers
app.use("/auth", GoogleAuthRouter);
app.use("/user", userRouter);

//---------------------Socket Io

io.on("connection", (server) => {
  server.on("join-room", (room) => {
    server.join(room?.id?.trim());
  });

  server.on("offer", ({ room, offer }) => {
    console.log("sss:", offer);
    console.log(room);

    server.to(room).emit("recieveOffer", offer);
  });

  server.on("answer", (ans) => {
    console.log("answerSide");
    console.log(ans);
    server.to(ans.Room).emit("answer", ans.answer);
  });

  server.on("ice", ({ room, candidate }) =>
    server.to(room).emit("ice", candidate)
  );
});

//------------------------Listen

server.listen(port, () => {
  console.log("server running on port:", port);
});
