import User from "../models/User.js";
export const becomeTutor = async (req, res) => {
  try {
    const { subjects, mode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user,
      {
        isTutor: true,
        subjects,
        mode,
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    user.isOnline = !user.isOnline;
    await user.save();

    res.json({ success: true, isOnline: user.isOnline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTutors = async (req, res) => {
  try {
    const { subject, mode } = req.query;

    let query = { isTutor: true };

    if (subject) {
      query.subjects = subject;
    }

    if (mode) {
      query.mode = mode;
    }

    const tutors = await User.find(query)
      .sort({ rating: -1 })
      .select("-password");

    res.json({ success: true, tutors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCredits = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user,
      { $inc: { credits: amount } },
      { new: true }
    ).select("-password");

    res.json({ success: true, credits: user.credits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const topUpCredits = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findByIdAndUpdate(
      req.user,
      { $inc: { credits: amount } },
      { new: true }
    ).select("-password");

    res.json({ success: true, credits: user.credits, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};