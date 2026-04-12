import { create } from "zustand";
import { api } from "../services/api";

export const useRequestStore = create((set) => ({
  requests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/requests");
      set({ requests: res.data.requests });
    } catch (err) {
      console.log(err);
    } finally {
      set({ loading: false });
    }
  },
  createRequest: async (data) => {
  try {
    const res = await api.post("/requests", data);

    // 🔥 update UI instantly
    set((state) => ({
      requests: [res.data.request, ...state.requests],
    }));

    return res.data.request;
  } catch (err) {
    console.log(err);
  }
},
}));