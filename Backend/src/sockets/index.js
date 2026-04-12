import { Server } from "socket.io";
import { socketHandler } from "./handler.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socketHandler(io, socket);
  });

  return io;
};