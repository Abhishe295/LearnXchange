import express from "express";
import { createDirectSession } from "../controllers/session.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/direct", protect, createDirectSession);

export default router;