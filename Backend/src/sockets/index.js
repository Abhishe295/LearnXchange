import { Server } from "socket.io";
import { socketHandler } from "./handler.js";

const FRONTEND_URL =
process.env.FRONTEND_URL || "http://localhost:5173";

export const initSocket = (server) => {
const io = new Server(server, {
cors: {
origin: FRONTEND_URL,
credentials: true,
},
});

io.on("connection", (socket) => {
socketHandler(io, socket);
});

return io;
};
