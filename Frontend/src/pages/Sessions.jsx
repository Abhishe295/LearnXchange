import { useEffect } from "react";
import { useAppointmentStore } from "../store/appointmentStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Sessions() {
  const { sessions, fetchSessions } = useAppointmentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const scheduled = sessions.filter((s) => s.status === "scheduled");
  const completed  = sessions.filter((s) => s.status === "completed");

  const SessionCard = ({ s }) => {
    const isTeacher = s.teacherId?._id === user?._id || s.teacherId === user?._id;
    const other = isTeacher ? s.studentId : s.teacherId;

    return (
      <div
        onClick={() => navigate(`/session/${s._id}`)}
        className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition cursor-pointer group"
      >
        <div className="flex items-start justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0 group-hover:scale-105 transition">
              {other?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{other?.username}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isTeacher ? "Student" : "Your Tutor"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">📅 {s.date ?? "—"}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">⏰ {s.time ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              s.status === "scheduled"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-500"
            }`}>
              {s.status === "scheduled" ? "📅 Scheduled" : "✅ Done"}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              s.mode === "online"
                ? "bg-green-100 text-green-600"
                : "bg-yellow-100 text-yellow-600"
            }`}>
              {s.mode === "online" ? "🟢 Online" : "🟡 Offline"}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">💬 Chat</span>
            {s.mode === "online" && s.status === "scheduled" && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg">🎥 Video</span>
            )}
          </div>
          <span className="text-xs text-blue-400 font-medium group-hover:text-blue-600 transition">
            Open →
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">My Sessions</h1>
        <span className="text-sm text-gray-400">{sessions.length} total</span>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Accept an appointment to get started</p>
        </div>
      )}

      {scheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Upcoming ({scheduled.length})
          </h2>
          <div className="space-y-3">
            {scheduled.map((s) => <SessionCard key={s._id} s={s} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Completed ({completed.length})
          </h2>
          <div className="space-y-3 opacity-80">
            {completed.map((s) => <SessionCard key={s._id} s={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}