import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  notifications: [],

  add: (notif) => set((s) => ({
    notifications: [
      { ...notif, id: Date.now(), read: false },
      ...s.notifications,
    ].slice(0, 20), // keep max 20
  })),

  markRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),

  clearAll: () => set({ notifications: [] }),
}));