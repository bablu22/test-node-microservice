import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import router from "./routes";

dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Log requests
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from user service" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.use("/", router);

// 404 Route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 4004;
const SERVICE_NAME = process.env.SERVICE_NAME || "user";

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} is running on port ${PORT}`);
});
