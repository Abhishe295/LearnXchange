import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      default: 10,
    },
    subjects: [String],
    isTutor: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    mode: [String], // ["online", "offline"]
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);