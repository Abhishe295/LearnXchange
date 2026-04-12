import { create } from "zustand";
import { api } from "../services/api";

export const useTutorStore = create((set) => ({
  tutors: [],
  loading: false,

  fetchTutors: async (filters = {}) => {
    set({ loading: true });

    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/users/tutors?${query}`);

      set({ tutors: res.data.tutors });
    } catch (err) {
      console.log(err);
    } finally {
      set({ loading: false });
    }
  },
  bookSession: async (tutorId, mode = "online") => {
  const res = await api.post("/sessions/direct", {
    tutorId,
    mode,
  });

  return res.data.session;
},
}));