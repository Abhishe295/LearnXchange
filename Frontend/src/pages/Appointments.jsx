import { useEffect } from "react";
import { useAppointmentStore } from "../store/appointmentStore";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Appointments() {
  const { appointments, fetchAppointments, accept, reject } = useAppointmentStore();
  const { user } = useAuthStore();
  const { socket, connect, emit } = useSocketStore();
  const navigate = useNavigate();

  useEffect(() => {
    connect();
    fetchAppointments();
  }, []);

  // Join personal room + listen for acceptance
  useEffect(() => {
    if (!socket || !user) return;

    emit("joinUserRoom", user._id);

    socket.on("appointmentAccepted", ({ sessionId }) => {
      toast.success("🎉 Tutor accepted your appointment!");
      fetchAppointments(); // refresh list
    });

    return () => socket.off("appointmentAccepted");
  }, [socket, user]);

  const handleAccept = async (id) => {
    const session = await accept(id);
    if (session) {
      toast.success("Session created!");
      fetchAppointments();
    }
  };

  const handleReject = async (id) => {
    await reject(id);
    toast("Appointment rejected", { icon: "❌" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">Appointments</h1>

      {appointments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>No appointments yet.</p>
        </div>
      )}

      {appointments.map((a) => {
        const isTutor = a.teacherId?._id === user?._id;
        const isStudent = a.studentId?._id === user?._id;

        return (
          <div key={a._id} className={`bg-white border rounded-xl p-4 mb-4 shadow-sm ${
            a.status === "accepted" ? "border-green-300" :
            a.status === "rejected" ? "opacity-50" : ""
          }`}>

            {/* HEADER */}
            <div className="flex justify-between items-start mb-3">
              <div>
                {isTutor ? (
                  <p className="font-semibold text-gray-800">
                    📩 From: <span className="text-blue-600">{a.studentId?.username}</span>
                  </p>
                ) : (
                  <p className="font-semibold text-gray-800">
                    👨‍🏫 Tutor: <span className="text-blue-600">{a.teacherId?.username}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  📅 {a.date} at {a.time}
                </p>
                <p className="text-sm text-gray-500">
                  📍 Mode: <span className="capitalize font-medium">{a.mode}</span>
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                a.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                a.status === "accepted" ? "bg-green-100 text-green-700" :
                                          "bg-red-100 text-red-600"
              }`}>
                {a.status}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 flex-wrap">

              {/* TUTOR actions */}
              {isTutor && a.status === "pending" && (
                <>
                  <button onClick={() => handleAccept(a._id)}
                    className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600 transition">
                    Accept ✅
                  </button>
                  <button onClick={() => handleReject(a._id)}
                    className="bg-red-400 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-500 transition">
                    Reject ❌
                  </button>
                </>
              )}

              {/* STUDENT waiting */}
              {isStudent && a.status === "pending" && (
                <p className="text-sm text-yellow-600 font-medium">
                  ⏳ Waiting for tutor to accept...
                </p>
              )}

              {/* ACCEPTED — go to session */}
              {a.status === "accepted" && a.sessionId && (
                <button
                  onClick={() => navigate(`/session/${a.sessionId}`)}
                  className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition">
                  Open Session →
                </button>
              )}

              {a.status === "rejected" && (
                <p className="text-sm text-red-400">Appointment was rejected.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}