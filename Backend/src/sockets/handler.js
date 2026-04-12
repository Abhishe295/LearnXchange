import Message from "../models/Message.js";
import User from "../models/User.js";

const callRooms = {};

export const socketHandler = (io, socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUserRoom", async (userId) => {
    socket.join(userId);
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("userOnline", userId);
  });

  socket.on("joinRequest", (requestId) => {
    socket.join(requestId);
  });

  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);

    // ✅ Assign caller/answerer role
    if (!callRooms[sessionId]) callRooms[sessionId] = [];

    // Don't add duplicates
    if (!callRooms[sessionId].includes(socket.id)) {
      callRooms[sessionId].push(socket.id);
    }

    const role = callRooms[sessionId].indexOf(socket.id) === 0
      ? "caller"
      : "answerer";

    socket.emit("webrtc:role", { role });
    console.log(`Socket ${socket.id} joined session ${sessionId} as ${role}`);
  });

  socket.on("sendMessage", async ({ sessionId, senderId, text }) => {
    try {
      const message = await Message.create({ sessionId, senderId, text });
      io.to(sessionId).emit("receiveMessage", message);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("webrtc:offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("webrtc:offer", offer);
  });

  socket.on("webrtc:answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("webrtc:answer", answer);
  });

  socket.on("webrtc:ice", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("webrtc:ice", candidate);
  });

  socket.on("webrtc:leave", ({ sessionId }) => {
    socket.to(sessionId).emit("webrtc:peerLeft");
    if (callRooms[sessionId]) {
      callRooms[sessionId] = callRooms[sessionId].filter(
        (id) => id !== socket.id
      );
      if (callRooms[sessionId].length === 0) {
        delete callRooms[sessionId];
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      io.emit("userOffline", socket.userId);
    }
    // Clean up call rooms
    Object.keys(callRooms).forEach((sessionId) => {
      callRooms[sessionId] = callRooms[sessionId].filter(
        (id) => id !== socket.id
      );
      if (callRooms[sessionId].length === 0) {
        delete callRooms[sessionId];
      }
    });
  });
};