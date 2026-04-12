import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useRequestStore } from "../store/requestStore";
import { useAppointmentStore } from "../store/appointmentStore";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { requests, fetchRequests } = useRequestStore();
  const { appointments, sessions, fetchAppointments, fetchSessions } = useAppointmentStore();

  useEffect(() => {
    fetchRequests();
    fetchAppointments();
    fetchSessions();
  }, []);

  // Stats
  const myRequests    = requests.filter((r) =>
    (r.studentId?._id ?? r.studentId) === user?._id
  );
  const pendingAppts  = appointments.filter((a) => a.status === "pending");
  const acceptedAppts = appointments.filter((a) => a.status === "accepted");
  const scheduledSessions  = sessions.filter((s) => s.status === "scheduled");
  const completedSessions  = sessions.filter((s) => s.status === "completed");

  const stats = [
    {
      label: "Credits",
      value: user?.credits ?? 0,
      icon: "💰",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      link: "/credits",
    },
    {
      label: "Pending",
      value: pendingAppts.length,
      icon: "⏳",
      color: "bg-yellow-50 text-yellow-600 border-yellow-100",
      link: "/appointments",
    },
    {
      label: "Sessions",
      value: scheduledSessions.length,
      icon: "📅",
      color: "bg-purple-50 text-purple-600 border-purple-100",
      link: "/sessions",
    },
    {
      label: "Completed",
      value: completedSessions.length,
      icon: "✅",
      color: "bg-green-50 text-green-600 border-green-100",
      link: "/sessions",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* WELCOME */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Hey, {user?.username} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {user?.isTutor
            ? "You're active as both a student and tutor"
            : "Find a tutor or post a request to get started"}
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`border rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition ${s.color}`}
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="text-2xl font-bold">{s.value}</span>
            <span className="text-xs font-medium opacity-70">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link to="/tutors"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-5 transition">
          <p className="text-2xl mb-2">👨‍🏫</p>
          <p className="font-semibold">Find Tutors</p>
          <p className="text-xs text-blue-100 mt-0.5">Book a direct session</p>
        </Link>
        <Link to="/post-request"
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-5 transition">
          <p className="text-2xl mb-2">📢</p>
          <p className="font-semibold">Post Request</p>
          <p className="text-xs text-purple-100 mt-0.5">Let tutors bid for you</p>
        </Link>
      </div>

      {/* AS TUTOR — incoming pending appointments */}
      {user?.isTutor && pendingAppts.filter(
        (a) => a.teacherId?._id === user?._id || a.teacherId === user?._id
      ).length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-700">
              🔔 Incoming Appointments
            </h2>
            <Link to="/appointments" className="text-xs text-blue-500">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingAppts
              .filter((a) => a.teacherId?._id === user?._id || a.teacherId === user?._id)
              .slice(0, 3)
              .map((a) => (
                <Link
                  to="/appointments"
                  key={a._id}
                  className="flex justify-between items-center bg-white border rounded-xl px-4 py-3 hover:shadow-sm transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {a.studentId?.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {a.date} at {a.time} · {a.mode}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* OPEN REQUESTS */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Open Requests</h2>
          <Link to="/post-request" className="text-xs text-blue-500">+ New</Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No open requests</p>
            <Link to="/post-request"
              className="text-blue-500 text-xs mt-2 inline-block hover:underline">
              Post one →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((req) => (
              <Link
                key={req._id}
                to={`/request/${req._id}`}
                className="flex justify-between items-start bg-white border rounded-xl px-4 py-3 hover:shadow-sm hover:border-blue-200 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {req.subject}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{req.topic}</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    by {req.studentId?.username}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-blue-600">
                    {req.maxCredits} cr
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    req.urgency === "high"
                      ? "bg-red-100 text-red-500"
                      : req.urgency === "medium"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {req.urgency}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}