import express from "express";
import {
  createRequest,
  getRequests,
} from "../controllers/request.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createRequest);
router.get("/", getRequests);

export default router;