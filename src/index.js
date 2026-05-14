import dotenv from "dotenv";
dotenv.config()

import express from "express";
import { connectPostgres } from "./configurations/database.js";
import { PORT } from "./constants.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

const startServer = async () => {
  try {
    await connectPostgres();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Application Startup Failed");

    process.exit(1);
  }
};

startServer();