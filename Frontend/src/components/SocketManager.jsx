import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useNotificationStore } from "../store/notificationStore";
import toast from "react-hot-toast";

export default function SocketManager() {
  const { user, refreshUser } = useAuthStore();
  const { connect, socket, emit } = useSocketStore();
  const { add } = useNotificationStore();

  // Connect + join personal room when user logs in
  useEffect(() => {
    if (!user) return;
    connect();
    const timer = setTimeout(() => {
      emit("joinUserRoom", user._id);
    }, 300);
    return () => clearTimeout(timer);
  }, [user]);

  // All global socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    // New bid on student's request
    socket.on("newBid", (bid) => {
      add({
        type: "bid",
        message: `💰 New bid of ${bid.credits} credits on your request`,
      });
      toast(`💰 New bid received!`, { icon: "🔔" });
    });

    // Tutor's bid was accepted by student
    socket.on("bidAccepted", (appointment) => {
      add({
        type: "appointment",
        message: `✅ Your bid was accepted! Check appointments.`,
      });
      toast.success("Your bid was accepted! 🎉");
    });

    // Student's appointment was accepted by tutor
    socket.on("appointmentAccepted", ({ sessionId }) => {
      add({
        type: "session",
        message: `🎉 Tutor accepted your appointment!`,
        sessionId,
      });
      toast.success("Tutor accepted your appointment! 🎉");
    });

    // Credits changed after session complete
    socket.on("creditsUpdated", ({ message }) => {
      add({ type: "credits", message });
      toast.success(message);
      refreshUser();
    });

    socket.on("newAppointment", ({ message, appointment }) => {
        add({
            type: "appointment",
            message,
        });
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

  // This component renders nothing — it's just logic
  return null;
}