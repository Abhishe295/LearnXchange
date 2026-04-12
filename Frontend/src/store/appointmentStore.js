import { create } from "zustand";
import { api } from "../services/api";

export const useAppointmentStore = create((set) => ({
  appointments: [],
  sessions: [],
  currentSession: null,
  loadingSession: false,

  fetchAppointments: async () => {
    const res = await api.get("/appointments");
    set({ appointments: res.data.appointments });
  },

  fetchSessions: async () => {
    const res = await api.get("/appointments/sessions");
    set({ sessions: res.data.sessions });
  },

  createFromBid: async (data) => {
    const res = await api.post("/appointments/from-bid", data);
    return res.data.appointment;
  },

  createDirect: async (data) => {
    const res = await api.post("/appointments/direct", data);
    return res.data.appointment;
  },

  accept: async (id) => {
    const res = await api.post(`/appointments/accept/${id}`);
    return res.data.session;
  },

  reject: async (id) => {   // ✅ new
    await api.post(`/appointments/reject/${id}`);
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a._id === id ? { ...a, status: "rejected" } : a
      ),
    }));
  },

  completeSession: async (id) => {   // ✅ new
    const res = await api.post(`/appointments/sessions/complete/${id}`);
    return res.data.session;
  },

  fetchSessionById: async (id) => {
  set({ loadingSession: true });
  try {
    const res = await api.get(`/appointments/sessions/${id}`);
    set({ currentSession: res.data.session });
  } catch (err) {
    console.log(err);
  } finally {
    set({ loadingSession: false });
  }
},

rateSession: async (id, { rating, review }) => {
  const res = await api.post(`/appointments/sessions/rate/${id}`, { rating, review });
  set({ currentSession: res.data.session });
  return res.data.session;
},

}));