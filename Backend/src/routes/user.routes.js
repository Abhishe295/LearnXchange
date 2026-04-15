import express from "express";
import {
  becomeTutor, toggleAvailability, getTutors,
  updateCredits, topUpCredits, updateProfile, getUserProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/become-tutor",    protect, becomeTutor);
router.patch("/availability",   protect, toggleAvailability);
router.get("/tutors",           getTutors);
router.patch("/credits",        protect, updateCredits);
router.patch("/credits/topup",  protect, topUpCredits);
router.patch("/profile",        protect, updateProfile);       // ✅
router.get("/profile/:userId",  getUserProfile);               // ✅ public

export default router;