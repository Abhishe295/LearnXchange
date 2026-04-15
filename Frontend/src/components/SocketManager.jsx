import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useNotificationStore } from "../store/notificationStore";
import { useRequestStore } from "../store/requestStore";
import toast from "react-hot-toast";

export default function SocketManager() {
  const { user, refreshUser } = useAuthStore();
  const { connect, socket, emit } = useSocketStore();
  const { add } = useNotificationStore();

  // Connect when user logs in
  useEffect(() => {
    if (!user) return;
    connect();
  }, [user]);

  // Join personal room once socket is connected
  useEffect(() => {
    if (!socket || !user) return;
    const join = () => emit("joinUserRoom", user._id);
    if (socket.connected) join();
    else socket.once("connect", join);
  }, [socket, user]);

  // Global socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on("newBid", (bid) => {
      add({ type: "bid", message: `💰 New bid of ${bid.credits} credits on your request` });
      toast("New bid received!", { icon: "💰" });
    });

    socket.on("bidAccepted", () => {
      add({ type: "appointment", message: "✅ Your bid was accepted! Check appointments." });
      toast.success("Your bid was accepted! 🎉");
    });

    socket.on("appointmentAccepted", ({ sessionId }) => {
      add({ type: "session", message: "🎉 Tutor accepted your appointment!", sessionId });
      toast.success("Tutor accepted your appointment!");
    });

    socket.on("creditsUpdated", ({ message }) => {
      add({ type: "credits", message });
      toast.success(message);
      refreshUser();
    });

    socket.on("newAppointment", ({ message }) => {
      add({ type: "appointment", message });
      toast(message, { icon: "📅" });
    });

    // ✅ New request — update all dashboards live
    socket.on("newRequest", (request) => {
      useRequestStore.getState().prependRequest(request);
    });

    socket.on("ratingReceived", ({ rating, newAvg, totalRatings }) => {
  add({
    type: "rating",
    message: `⭐ You received a ${rating}-star rating! New avg: ${newAvg}`,
  });
  toast.success(`New rating received: ${rating} stars ⭐`);
  refreshUser();
});

    return () => {
      socket.off("newBid");
      socket.off("bidAccepted");
      socket.off("appointmentAccepted");
      socket.off("creditsUpdated");
      socket.off("newAppointment");
      socket.off("newRequest");
      socket.off("ratingReceived");
    };
  }, [socket, user]);

  return null;
}