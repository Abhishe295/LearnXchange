import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import http from "http";
import { initSocket } from "./sockets/index.js";
import bidRoutes from "./routes/bid.routes.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import requestRoutes from "./routes/request.routes.js";
import userRoutes from "./routes/user.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6550;

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

const server = http.createServer(app);
const io = initSocket(server);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // postman / mobile
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin), false);
    },
    credentials: true,
  })
);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use((req,res,next)=>{
    req.io = io;
    next();
})


app.use("/api/auth", authRoutes);
app.use("/api/requests",requestRoutes);
app.use("/api/bids",bidRoutes);
app.use("/api/users",userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/appointments",appointmentRoutes);


app.get("/", (req, res) => {
  res.send("API running 🚀");
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});