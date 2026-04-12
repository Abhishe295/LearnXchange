import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Request from "./models/Request.js";
import Bid from "./models/Bid.js";
import Session from "./models/Session.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Request.deleteMany();
  await Bid.deleteMany();
  await Session.deleteMany();

  const hashed = await bcrypt.hash("123456", 10);

  /* ================= USERS ================= */

  const users = await User.insertMany([
    {
      username: "rahul",
      email: "rahul@test.com",
      password: hashed,
      isTutor: true,
      subjects: ["DSA", "OS"],
      isOnline: true,
      mode: ["online"],
      rating: 4.8,
    },
    {
      username: "aman",
      email: "aman@test.com",
      password: hashed,
      isTutor: true,
      subjects: ["Maths"],
      isOnline: false,
      mode: ["offline"],
      rating: 4.5,
    },
    {
      username: "neha",
      email: "neha@test.com",
      password: hashed,
      isTutor: true,
      subjects: ["DBMS", "CN"],
      isOnline: true,
      mode: ["online", "offline"],
      rating: 4.9,
    },
    {
      username: "simran",
      email: "simran@test.com",
      password: hashed,
      isTutor: true,
      subjects: ["Java"],
      isOnline: false,
      mode: ["offline"],
      rating: 4.3,
    },
    {
      username: "student1",
      email: "s1@test.com",
      password: hashed,
    },
    {
      username: "student2",
      email: "s2@test.com",
      password: hashed,
    },
  ]);

  const [rahul, aman, neha, simran, student1, student2] = users;

  /* ================= REQUESTS ================= */

  const requests = await Request.insertMany([
    {
      studentId: student1._id,
      subject: "DSA",
      topic: "Binary Trees",
      urgency: "high",
      maxCredits: 5,
    },
    {
      studentId: student2._id,
      subject: "Maths",
      topic: "Integration",
      urgency: "medium",
      maxCredits: 3,
    },
  ]);

  const [req1, req2] = requests;

  /* ================= BIDS ================= */

  const bids = await Bid.insertMany([
    {
      requestId: req1._id,
      teacherId: rahul._id,
      credits: 4,
      message: "I can teach trees well",
    },
    {
      requestId: req1._id,
      teacherId: neha._id,
      credits: 5,
      message: "Advanced explanation",
    },
    {
      requestId: req2._id,
      teacherId: aman._id,
      credits: 3,
      message: "Offline help available",
    },
  ]);

  /* ================= SESSION ================= */

  await Session.create({
    requestId: req1._id,
    bidId: bids[0]._id,
    studentId: student1._id,
    teacherId: rahul._id,
    status: "scheduled",
  });

  console.log("🔥 Dummy data seeded");
  process.exit();
};

seed();