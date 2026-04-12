import { create } from "zustand";
import { useSocketStore } from "./socketStore";

let isListening = false;

export const useChatStore = create((set) => ({
  messages: [],

  /* JOIN ROOM */
  joinSession: (sessionId) => {
    const { emit } = useSocketStore.getState();
    emit("joinSession", sessionId);
  },

  /* SEND MESSAGE */
sendMessage: (sessionId, text, senderId) => {
  const { emit } = useSocketStore.getState();
  if (!text.trim()) return;
  emit("sendMessage", { sessionId, senderId, text });
},

  /* LISTEN */
  listenMessages: () => {
    if (isListening) return;
    isListening = true;

    const { on } = useSocketStore.getState();

    on("receiveMessage", (msg) => {
      set((state) => ({
        messages: [...state.messages, msg],
      }));
    });
  },

  /* STOP */
  stopListening: () => {
    const { off } = useSocketStore.getState();
    off("receiveMessage");
    isListening = false;
  },

  clear: () => set({ messages: [] }),
}));