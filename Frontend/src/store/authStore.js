import { create } from "zustand";
import { api } from "../services/api";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  user: null,

  signup: async (data) => {
    try {
      const res = await api.post("/auth/register", data);
      set({ user: res.data.user });
      toast.success("Registered successfully 🔥");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  },

  login: async (data) => {
    try {
      const res = await api.post("/auth/login", data);
      set({ user: res.data.user });
      toast.success("Login successful 🔥");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user });
    } catch {
      set({ user: null });
    }
  },

  // ✅ refresh user from server (call after credits change)
  refreshUser: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user });
    } catch (err) {
      console.log(err);
    }
  },

  topUpCredits: async (amount) => {
    try {
      const res = await api.patch("/users/credits/topup", { amount });
      set((s) => ({ user: { ...s.user, credits: res.data.credits } }));
      toast.success(`+${amount} credits added! 🎉`);
      return res.data.credits;
    } catch (err) {
      toast.error("Failed to add credits");
    }
  },
}));