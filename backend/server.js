import express from "express";
import { Router } from "express";

const app = express();
const port = 8080;

app.use(express.json());

app.listen(port, () => {
  console.log("server running on port:", port);
});
