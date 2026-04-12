import express from "express";
import {
  createFromBid,
  createDirect,
  acceptAppointment,
  getAppointments,
  completeSession,
  getSessions,
  rejectAppointment,
  rateSession,
  getSessionById,
} from "../controllers/appointment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/sessions", protect, getSessions);
router.post("/sessions/complete/:id", protect, completeSession);  // ← before /:id
router.post("/sessions/rate/:id", protect, rateSession);          // ← before /:id
router.get("/sessions/:id", protect, getSessionById);             // ← last
router.post("/from-bid", protect, createFromBid);
router.post("/direct", protect, createDirect);
router.post("/accept/:id", protect, acceptAppointment);
router.post("/reject/:id", protect, rejectAppointment);
router.get("/", protect, getAppointments);

export default router;