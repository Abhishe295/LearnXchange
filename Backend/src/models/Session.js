import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  requestId:     { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
  bidId:         { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  teacherId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date:          String,
  time:          String,
  meetLink:      { type: String, default: "" },
  mode:          { type: String, enum: ["online", "offline"], default: "online" },
  status:        { type: String, enum: ["scheduled", "completed"], default: "scheduled" },
  // ✅ rating
  rating:        { type: Number, min: 1, max: 5, default: null },
  review:        { type: String, default: "" },
  ratedAt:       { type: Date },
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);