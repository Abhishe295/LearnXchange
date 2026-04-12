import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
    },

    date: String,
    time: String,

    mode: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    credits:{
        type: Number,
        default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);