import Message from "../models/Message.js";
import User from "../models/User.js";

const callRooms = {};
// sessionId -> { caller: socketId|null, answerer: socketId|null }

function getOrCreateRoom(sessionId) {
  if (!callRooms[sessionId]) {
    callRooms[sessionId] = { caller: null, answerer: null };
  }
  return callRooms[sessionId];
}

function cleanRoom(sessionId, io) {
  const room = callRooms[sessionId];
  if (!room) return;
  if (room.caller && !io.sockets.sockets.has(room.caller)) room.caller = null;
  if (room.answerer && !io.sockets.sockets.has(room.answerer)) room.answerer = null;
}

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
    socket.currentSession = sessionId;

    const room = getOrCreateRoom(sessionId);
    cleanRoom(sessionId, io);

    // ✅ Already assigned a role — just re-confirm it (StrictMode remount)
    if (room.caller === socket.id) {
      console.log(`[WebRTC] ${socket.id} re-confirmed as caller`);
      socket.emit("webrtc:role", { role: "caller" });
      if (room.answerer) io.to(socket.id).emit("webrtc:ready");
      return;
    }

    if (room.answerer === socket.id) {
      console.log(`[WebRTC] ${socket.id} re-confirmed as answerer`);
      socket.emit("webrtc:role", { role: "answerer" });
      return;
    }

    // ✅ New socket — assign role
    if (!room.caller) {
      room.caller = socket.id;
      console.log(`[WebRTC] ${socket.id} → caller`);
      socket.emit("webrtc:role", { role: "caller" });
      return;
    }

    if (!room.answerer) {
      room.answerer = socket.id;
      console.log(`[WebRTC] ${socket.id} → answerer`);
      socket.emit("webrtc:role", { role: "answerer" });
      // ✅ Both present — signal caller
      console.log(`[WebRTC] Both ready, signaling caller ${room.caller}`);
      io.to(room.caller).emit("webrtc:ready");
      return;
    }

    // Room full
    console.log(`[WebRTC] Room full, rejecting ${socket.id}`);
    socket.emit("webrtc:full");
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
    console.log(`[WebRTC] offer from ${socket.id}`);
    socket.to(sessionId).emit("webrtc:offer", offer);
  });

  socket.on("webrtc:answer", ({ sessionId, answer }) => {
    console.log(`[WebRTC] answer from ${socket.id}`);
    socket.to(sessionId).emit("webrtc:answer", answer);
  });

  socket.on("webrtc:ice", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("webrtc:ice", candidate);
  });

  socket.on("webrtc:leave", ({ sessionId }) => {
    socket.to(sessionId).emit("webrtc:peerLeft");
    const room = callRooms[sessionId];
    if (room) {
      if (room.caller === socket.id) room.caller = null;
      if (room.answerer === socket.id) room.answerer = null;
      if (!room.caller && !room.answerer) delete callRooms[sessionId];
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    const sessionId = socket.currentSession;
    if (sessionId && callRooms[sessionId]) {
      const room = callRooms[sessionId];
      if (room.caller === socket.id || room.answerer === socket.id) {
        socket.to(sessionId).emit("webrtc:peerLeft");
        if (room.caller === socket.id) room.caller = null;
        if (room.answerer === socket.id) room.answerer = null;
        if (!room.caller && !room.answerer) delete callRooms[sessionId];
      }
    }

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