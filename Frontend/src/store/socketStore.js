import { create } from "zustand";
import { io } from "socket.io-client";

export const useSocketStore = create((set, get) => ({
  socket: null,

  connect: () => {
    // ✅ If socket already exists (connected or connecting), don't make a new one
    if (get().socket) return;

    const BASE_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:6550";

    const socket = io(BASE_URL, {
      withCredentials: true,
    });

    // ✅ Store immediately so duplicate connect() calls are blocked
    set({ socket });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected ✅", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[SOCKET] Disconnected");
      set({ socket: null });
    });

    socket.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
    });
  },

  emit: (event, data) => {
    const socket = get().socket;
    if (!socket) return console.warn(`[SOCKET] emit "${event}" failed — not connected`);
    socket.emit(event, data);
  },

  on: (event, cb) => {
    const socket = get().socket;
    if (!socket) return;
    socket.on(event, cb);
  },

  off: (event) => {
    const socket = get().socket;
    socket?.off(event);
  },
}));