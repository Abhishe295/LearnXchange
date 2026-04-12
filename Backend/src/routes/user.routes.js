import express from "express";
import {
  becomeTutor,
  toggleAvailability,
  getTutors,
  updateCredits,
  topUpCredits,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/become-tutor", protect, becomeTutor);
router.patch("/availability", protect, toggleAvailability);
router.get("/tutors", getTutors);
router.patch("/credits", protect, updateCredits);
router.patch("/credits/topup",protect,topUpCredits);


export default router;