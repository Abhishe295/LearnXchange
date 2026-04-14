// routes/turn.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/credentials", protect, async (req, res) => {
  try {
    const response = await fetch(
      `https://${process.env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
    );
    const iceServers = await response.json();
    res.json({ iceServers });
  } catch (err) {
    res.status(500).json({ message: "Failed to get TURN credentials" });
  }
});

export default router;