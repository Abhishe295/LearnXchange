import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useNotificationStore } from "../store/notificationStore";
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

  // Join personal room once socket is actually connected
  useEffect(() => {
    if (!socket || !user) return;

    // ✅ Wait for confirmed connection before joining room
    if (socket.connected) {
      emit("joinUserRoom", user._id);
    } else {
      socket.once("connect", () => {
        emit("joinUserRoom", user._id);
      });
    }
  }, [socket, user]);

  // All global socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on("newBid", (bid) => {
      add({ type: "bid", message: `💰 New bid of ${bid.credits} credits on your request` });
      toast(`💰 New bid received!`, { icon: "🔔" });
    });

    socket.on("bidAccepted", () => {
      add({ type: "appointment", message: `✅ Your bid was accepted! Check appointments.` });
      toast.success("Your bid was accepted! 🎉");
    });

    socket.on("appointmentAccepted", ({ sessionId }) => {
      add({ type: "session", message: `🎉 Tutor accepted your appointment!`, sessionId });
      toast.success("Tutor accepted your appointment! 🎉");
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

    return () => {
      socket.off("newBid");
      socket.off("bidAccepted");
      socket.off("appointmentAccepted");
      socket.off("creditsUpdated");
      socket.off("newAppointment");
    };
  }, [socket, user]);

  return null;
}