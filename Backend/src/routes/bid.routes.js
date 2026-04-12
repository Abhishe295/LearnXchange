import express from "express";
import {
  createBid,
  getBids,
  acceptBid,
} from "../controllers/bid.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createBid);
router.get("/:requestId", getBids);
router.post("/accept/:bidId", protect, acceptBid);

export default router;