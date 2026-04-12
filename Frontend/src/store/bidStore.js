import { create } from "zustand";
import { api } from "../services/api";

export const useBidStore = create((set) => ({
  bids: [],

  fetchBids: async (requestId) => {
    try {
      const res = await api.get(`/bids/${requestId}`);
      set({ bids: res.data.bids });
    } catch (err) {
      console.log(err);
    }
  },

  placeBid: async (data) => {
    await api.post("/bids", data);
  },

  acceptBid: async (bidId, {date, time,mode}) => {
    const res = await api.post(`/bids/accept/${bidId}`,{date,time,mode});
    return res.data.session;
  },
}));