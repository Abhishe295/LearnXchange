import Session from "../models/Session.js";

export const createDirectSession = async (req, res) => {
  try {
    const { tutorId, mode } = req.body;

    const session = await Session.create({
      studentId: req.user,
      teacherId: tutorId,
      mode: mode || "online",
      status: "scheduled",
    });

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};