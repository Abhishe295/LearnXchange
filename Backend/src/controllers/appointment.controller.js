import Appointment from "../models/Appointment.js";
import Bid from "../models/Bid.js";
import Request from "../models/Request.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

/* ================= CREATE FROM BID ================= */
export const createFromBid = async (req, res) => {
  try {
    const { bidId, date, time } = req.body;

    const bid = await Bid.findById(bidId);
    const request = await Request.findById(bid.requestId);

    const appointment = await Appointment.create({
      studentId: request.studentId,
      teacherId: bid.teacherId,
      requestId: request._id,
      bidId: bid._id,
      date,
      time,
    });

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CREATE DIRECT ================= */
export const createDirect = async (req, res) => {
  try {
    const { tutorId, date, time, mode, credits } = req.body;

    const student = await User.findById(req.user);
    if (student.credits < credits) {
      return res.status(400).json({ message: "Insufficient credits" });
    }

    const appointment = await Appointment.create({
      studentId: req.user,
      teacherId: tutorId,
      date, time, mode, credits,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("studentId", "username")
      .populate("teacherId", "username");

    // ✅ Notify tutor immediately
    req.io.to(tutorId.toString()).emit("newAppointment", {
      message: `📅 ${student.username} wants to book a session with you!`,
      appointment: populated,
    });

    res.json({ success: true, appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ACCEPT ================= */
// Fix acceptAppointment to pass date/time into session
export const acceptAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    appointment.status = "accepted";
    await appointment.save();

// In acceptAppointment, generate a unique meet link
const roomId = `learnxchange-${appointment._id}`;
const session = await Session.create({
  studentId: appointment.studentId,
  teacherId: appointment.teacherId,
  appointmentId: appointment._id,
  mode: appointment.mode,
  date: appointment.date,
  time: appointment.time,
  status: "scheduled",
  // ✅ Use whereby.com free rooms — no auth needed
  meetLink: appointment.mode === "online"
    ? `https://whereby.com/${roomId}`
    : "",
});

    appointment.sessionId = session._id;
    await appointment.save();

    // Notify student via socket
    // In acceptAppointment, change the emit to use studentId room
    req.io.to(appointment.studentId.toString()).emit("appointmentAccepted", {
    sessionId: session._id,
    message: "Your appointment was accepted!",
    });

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW — reject
export const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    appointment.status = "rejected";
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW — get sessions for logged-in user
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ studentId: req.user }, { teacherId: req.user }],
    })
      .populate("studentId", "username")
      .populate("teacherId", "username")
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW — complete session + transfer credits
// export const completeSession = async (req, res) => {
//   try {
//     const session = await Session.findById(req.params.id);
//     if (!session) return res.status(404).json({ message: "Not found" });
//     if (session.status === "completed") {
//       return res.status(400).json({ message: "Already completed" });
//     }

//     session.status = "completed";
//     await session.save();

//     // Find appointment
//     const appointment = await Appointment.findOne({ sessionId: session._id });
//     let creditsAmount = 0;

//     if (appointment) {
//       if (appointment.bidId) {
//         // Bidding flow — use bid credits
//         const bid = await Bid.findById(appointment.bidId);
//         if (bid) creditsAmount = bid.credits;
//       } else if (appointment.credits) {
//         // Direct flow — use appointment credits
//         creditsAmount = appointment.credits;
//       }

//       if (creditsAmount > 0) {
//         const student = await User.findById(session.studentId);
//         if (student.credits < creditsAmount) {
//           return res.status(400).json({ message: "Student has insufficient credits" });
//         }

//         await User.findByIdAndUpdate(session.studentId, {
//           $inc: { credits: -creditsAmount },
//         });
//         await User.findByIdAndUpdate(session.teacherId, {
//           $inc: { credits: creditsAmount },
//         });
//       }
//     }

//     // Notify both via socket
//     req.io.to(session.studentId.toString()).emit("creditsUpdated", {
//       message: `Session complete! -${creditsAmount} credits deducted`,
//     });
//     req.io.to(session.teacherId.toString()).emit("creditsUpdated", {
//       message: `Session complete! +${creditsAmount} credits earned 🎉`,
//     });

//     res.json({ success: true, session, creditsAmount });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

/* ================= GET ================= */
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [
        { studentId: req.user },
        { teacherId: req.user },
      ],
    })
      .populate("studentId", "username")
      .populate("teacherId", "username")
      .sort({ createdAt: -1 });

    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("studentId", "username credits")
      .populate("teacherId", "username credits rating");

    if (!session) return res.status(404).json({ message: "Not found" });

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rateSession = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const session = await Session.findById(req.params.id)
      .populate("teacherId");

    if (!session) return res.status(404).json({ message: "Not found" });
    if (session.status !== "completed") {
      return res.status(400).json({ message: "Session not completed yet" });
    }
    if (session.rating) {
      return res.status(400).json({ message: "Already rated" });
    }
    if (session.studentId.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Only student can rate" });
    }

    session.rating  = rating;
    session.review  = review;
    session.ratedAt = new Date();
    await session.save();

    // Recalculate tutor's average rating
    const allRated = await Session.find({
      teacherId: session.teacherId._id,
      rating: { $ne: null },
    });
    const avg = allRated.reduce((sum, s) => sum + s.rating, 0) / allRated.length;

    await User.findByIdAndUpdate(session.teacherId._id, {
      rating:       Math.round(avg * 10) / 10,
      totalRatings: allRated.length,
    });

    // ✅ Emit real-time rating update to tutor
    req.io.to(session.teacherId._id.toString()).emit("ratingReceived", {
      rating,
      newAvg: Math.round(avg * 10) / 10,
      totalRatings: allRated.length,
    });

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Also fix completeSession to increment sessionsCompleted
export const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Not found" });
    if (session.status === "completed") {
      return res.status(400).json({ message: "Already completed" });
    }

    session.status = "completed";
    await session.save();

    // ✅ Increment sessionsCompleted for both users
    await User.findByIdAndUpdate(session.studentId, { $inc: { sessionsCompleted: 1 } });
    await User.findByIdAndUpdate(session.teacherId,  { $inc: { sessionsCompleted: 1 } });

    const appointment = await Appointment.findOne({ sessionId: session._id });
    let creditsAmount = 0;

    if (appointment) {
      if (appointment.bidId) {
        const bid = await Bid.findById(appointment.bidId);
        if (bid) creditsAmount = bid.credits;
      } else if (appointment.credits) {
        creditsAmount = appointment.credits;
      }

      if (creditsAmount > 0) {
        const student = await User.findById(session.studentId);
        if (student.credits < creditsAmount) {
          return res.status(400).json({ message: "Insufficient credits" });
        }
        await User.findByIdAndUpdate(session.studentId, { $inc: { credits: -creditsAmount } });
        await User.findByIdAndUpdate(session.teacherId,  { $inc: { credits:  creditsAmount } });
      }
    }

    req.io.to(session.studentId.toString()).emit("creditsUpdated", {
      message: `Session complete! -${creditsAmount} credits deducted`,
    });
    req.io.to(session.teacherId.toString()).emit("creditsUpdated", {
      message: `Session complete! +${creditsAmount} credits earned 🎉`,
    });

    res.json({ success: true, session, creditsAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

