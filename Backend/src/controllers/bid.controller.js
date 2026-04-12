import Bid from "../models/Bid.js";
import Request from "../models/Request.js";
import Session from "../models/Session.js";
import Appointment from "../models/Appointment.js";

/* ================= CREATE BID ================= */
export const createBid = async (req, res) => {
  try {
    const { requestId, credits, message } = req.body;

    const bid = await Bid.create({
      requestId,
      teacherId: req.user,
      credits,
      message,
    });

    // ✅ Populate before emitting so frontend gets username
    const populated = await Bid.findById(bid._id)
      .populate("teacherId", "username rating");

    req.io.to(requestId).emit("newBid", populated);

    res.status(201).json({ success: true, bid: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET BIDS ================= */
export const getBids = async (req, res) => {
  try {
    const { requestId } = req.params;

    const bids = await Bid.find({ requestId })
      .populate("teacherId", "username")
      .sort({ createdAt: -1 });

    res.json({ success: true, bids });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ACCEPT BID ================= */
export const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { date, time, mode } = req.body; // student sends these now

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const request = await Request.findById(bid.requestId);

    bid.status = "accepted";
    await bid.save();

    await Bid.updateMany(
      { requestId: bid.requestId, _id: { $ne: bidId } },
      { status: "rejected" }
    );

    request.status = "closed";
    await request.save();

    // ✅ Create APPOINTMENT (pending), NOT session
    const appointment = await Appointment.create({
      studentId: request.studentId,
      teacherId: bid.teacherId,
      requestId: request._id,
      bidId: bid._id,
      date,
      time,
      mode: mode || "online",
      status: "pending",
    });

    req.io.to(bid.requestId.toString()).emit("bidAccepted", appointment);

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};