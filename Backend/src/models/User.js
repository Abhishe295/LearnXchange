import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  credits:     { type: Number, default: 10 },

  // Role — not restricted, user chooses both if they want
  role:        { type: String, enum: ["student", "tutor", "both"], default: "student" },
  isTutor:     { type: Boolean, default: false },
  isOnline:    { type: Boolean, default: false },

  // Tutor fields
  subjects:    [String],
  mode:        [String],
  rating:      { type: Number, default: 0 },
  totalRatings:{ type: Number, default: 0 },
  bio:         { type: String, default: "" },
  specialisation: { type: String, default: "" },

  // Profile fields
  age:         { type: Number, default: null },
  gender:      { type: String, enum: ["male", "female", "other", "prefer_not"], default: "prefer_not" },
  location:    { type: String, default: "" },
  sessionsCompleted: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("User", userSchema);