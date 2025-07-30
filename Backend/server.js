import express from "express";
import dotenv from "dotenv/config";
import connectDB from './configs/connectDatabase.js';
import viewEngine from "./configs/viewEngine.js";
import initAPIRoute from "./router/apiRouter.js";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from './configs/logger.js'; 

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// View engine setup
viewEngine(app);

// Serve static files
app.use("/templates", express.static(path.join(__dirname, "public/templates")));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "views"))); // For CSS, JS in views

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3001"],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

// Parse cookies
app.use(cookieParser());

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info("Successfully connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB:", err);
  });

// Initialize routes
initAPIRoute(app);
// Start the server
app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
});
// Start the server
app.listen(port, () => {
  logger.info(`Server is running on Port:${port}`);
  console.log(`Link at http://localhost:${port}`);
});
