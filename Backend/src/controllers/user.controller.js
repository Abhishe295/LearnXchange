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

export const updateProfile = async (req, res) => {
  try {
    const {
      username, bio, specialisation, subjects,
      mode, age, gender, location, role,
    } = req.body;

    const updateFields = {};
    if (username)       updateFields.username       = username;
    if (bio !== undefined) updateFields.bio         = bio;
    if (specialisation !== undefined) updateFields.specialisation = specialisation;
    if (subjects)       updateFields.subjects       = subjects;
    if (mode)           updateFields.mode           = mode;
    if (age !== undefined) updateFields.age         = age;
    if (gender)         updateFields.gender         = gender;
    if (location !== undefined) updateFields.location = location;
    if (role) {
      updateFields.role    = role;
      updateFields.isTutor = role === "tutor" || role === "both";
    }

    const user = await User.findByIdAndUpdate(
      req.user,
      updateFields,
      { new: true }
    ).select("-password");

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Count completed sessions
    const Session = (await import("../models/Session.js")).default;
    const sessionsCompleted = await Session.countDocuments({
      $or: [{ studentId: userId }, { teacherId: userId }],
      status: "completed",
    });

    // Get recent ratings if tutor
    const recentRatings = await Session.find({
      teacherId: userId,
      rating: { $ne: null },
      status: "completed",
    })
      .populate("studentId", "username")
      .sort({ ratedAt: -1 })
      .limit(5)
      .select("rating review ratedAt studentId");

    res.json({ success: true, user, sessionsCompleted, recentRatings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};