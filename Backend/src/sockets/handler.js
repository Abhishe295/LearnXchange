import Message from "../models/Message.js";
import User from "../models/User.js";

const callRooms = {};

export const socketHandler = (io, socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUserRoom", async (userId) => {
    socket.join(userId);
    socket.userId = userId;
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userOnline", userId);
    } catch (e) {
      console.log("joinUserRoom error:", e);
    }
  });

  socket.on("joinRequest", (requestId) => {
    socket.join(requestId);
  });

 socket.on("joinSession", (sessionId) => {
socket.join(sessionId);

if (!callRooms[sessionId]) callRooms[sessionId] = [];

// ✅ Remove dead sockets (IMPORTANT FIX)
callRooms[sessionId] = callRooms[sessionId].filter((id) =>
io.sockets.sockets.has(id)
);

if (!callRooms[sessionId].includes(socket.id)) {
callRooms[sessionId].push(socket.id);
}

const role = callRooms[sessionId].length === 1 ? "caller" : "answerer";

console.log(`[WebRTC] ${socket.id} → ${role} (${callRooms[sessionId].length} in room)`);

socket.emit("webrtc:role", { role });

if (callRooms[sessionId].length === 2) {
const callerSocketId = callRooms[sessionId][0];
io.to(callerSocketId).emit("webrtc:ready");
}
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
    console.log(`[WebRTC] offer from ${socket.id} to room ${sessionId}`);
    socket.to(sessionId).emit("webrtc:offer", offer);
  });

  socket.on("webrtc:answer", ({ sessionId, answer }) => {
    console.log(`[WebRTC] answer from ${socket.id} to room ${sessionId}`);
    socket.to(sessionId).emit("webrtc:answer", answer);
  });

  socket.on("webrtc:ice", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("webrtc:ice", candidate);
  });

  socket.on("webrtc:leave", ({ sessionId }) => {
    socket.to(sessionId).emit("webrtc:peerLeft");
    if (callRooms[sessionId]) {
      callRooms[sessionId] = callRooms[sessionId].filter((id) => id !== socket.id);
      if (callRooms[sessionId].length === 0) delete callRooms[sessionId];
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    // ✅ Notify peers in any session this socket was part of
    Object.keys(callRooms).forEach((sessionId) => {
      if (callRooms[sessionId].includes(socket.id)) {
        socket.to(sessionId).emit("webrtc:peerLeft");
        callRooms[sessionId] = callRooms[sessionId].filter((id) => id !== socket.id);
        if (callRooms[sessionId].length === 0) delete callRooms[sessionId];
      }
    });

    if (socket.userId) {
      try {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
        io.emit("userOffline", socket.userId);
      } catch (e) {
        console.log("disconnect update error:", e);
      }
    }
  });
};