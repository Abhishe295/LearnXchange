import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import { useAppointmentStore } from "../store/appointmentStore";
import toast from "react-hot-toast";

export default function PersonalizedSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { currentSession, fetchSessionById, loadingSession,
          completeSession, rateSession } = useAppointmentStore();
  const { messages, sendMessage, joinSession,
          listenMessages, stopListening } = useChatStore();
  const { connect, socket, emit } = useSocketStore();

  const [text, setText]             = useState("");
  const [tab, setTab]               = useState("chat"); // chat | info
  const [completing, setCompleting] = useState(false);
  const [rating, setRating]         = useState(0);
  const [review, setReview]         = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const bottomRef = useRef(null);

  const s = currentSession;
  const isTeacher = s?.teacherId?._id === user?._id ||
                    s?.teacherId === user?._id;
  const other = s ? (isTeacher ? s.studentId : s.teacherId) : null;

  useEffect(() => {
    fetchSessionById(id);
    connect();
    const timer = setTimeout(() => {
      joinSession(id);
      listenMessages();
    }, 200);
    return () => {
      stopListening();
      useChatStore.getState().clear();
      clearTimeout(timer);
    };
  }, [id]);

  // Join personal room for credit update notifications
  useEffect(() => {
    if (!socket || !user) return;
    emit("joinUserRoom", user._id);

    socket.on("creditsUpdated", ({ message }) => {
      toast.success(message);
      refreshUser();
    });
    return () => socket.off("creditsUpdated");
  }, [socket, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(id, text, user._id);
    setText("");
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeSession(id);
      await refreshUser();
      await fetchSessionById(id);
      toast.success("Session complete! Credits transferred 💸");
    } catch {
      toast.error("Failed to complete session");
    } finally {
      setCompleting(false);
    }
  };

  const handleRate = async () => {
    if (!rating) return toast.error("Pick a star rating");
    setSubmittingRating(true);
    try {
      await rateSession(id, { rating, review });
      toast.success("Thanks for the feedback! ⭐");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-16 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">😕</p>
        <p>Session not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">

      {/* SESSION HERO CARD */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
              {other?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{other?.username}</p>
              <p className="text-xs text-gray-400">
                {isTeacher ? "Student" : "Your Tutor"}
              </p>
              {!isTeacher && s.teacherId?.rating > 0 && (
                <p className="text-xs text-yellow-500 mt-0.5">
                  ⭐ {s.teacherId.rating.toFixed(1)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              s.status === "scheduled"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            }`}>
              {s.status === "scheduled" ? "📅 Scheduled" : "✅ Completed"}
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

        {/* TIME */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Scheduled for</p>
            <p className="text-sm font-bold text-gray-800">
              📅 {s.date ?? "—"} &nbsp; ⏰ {s.time ?? "—"}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2 mt-4">
          {s.mode === "online" && s.status === "scheduled" && (
            <button
              onClick={() => navigate(`/session/${id}/call`)}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-600 transition"
            >
              🎥 Join Video Call
            </button>
          )}

          {s.mode === "online" && s.meetLink && (
            <a
              href={s.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition"
            >
              📹 Google Meet
            </a>
          )}

          {isTeacher && s.status === "scheduled" && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {completing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Completing...
                </span>
              ) : "✅ Mark Complete"}
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {["chat", "info"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              tab === t
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "chat" ? "💬 Chat" : "ℹ️ Info"}
          </button>
        ))}
      </div>

      {/* TAB: CHAT */}
      {tab === "chat" && (
        <div className="bg-white border rounded-2xl shadow-sm flex flex-col" style={{ height: "420px" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="font-semibold text-gray-700 text-sm">
              Chat with {other?.username}
            </p>
            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">
                No messages yet. Say hello! 👋
              </p>
            )}
            {messages.map((m, i) => {
              const isMe = m.senderId === user?._id ||
                           m.senderId?._id === user?._id;
              return (
                <div key={i} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {other?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-semibold text-blue-500 mb-1">
                        {other?.username}
                      </p>
                    )}
                    <p>{m.text}</p>
                    <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {isMe && (
                    <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-40 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* TAB: INFO */}
      {tab === "info" && (
        <div className="space-y-4">

          {/* SESSION DETAILS */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-3">Session Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Session ID</span>
                <span className="font-mono text-xs text-gray-500">{s._id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mode</span>
                <span className="capitalize">{s.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span>{s.date ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time</span>
                <span>{s.time ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="capitalize font-medium">{s.status}</span>
              </div>
            </div>
          </div>

          {/* RATING — only student, only after complete, not yet rated */}
          {!isTeacher && s.status === "completed" && !s.rating && (
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-1">Rate this session</h3>
              <p className="text-xs text-gray-400 mb-4">
                Your feedback helps tutors improve
              </p>

              {/* STARS */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition hover:scale-110 ${
                      star <= rating ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Leave a review (optional)..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none mb-3"
              />

              <button
                onClick={handleRate}
                disabled={!rating || submittingRating}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition"
              >
                {submittingRating ? "Submitting..." : "Submit Rating ⭐"}
              </button>
            </div>
          )}

          {/* ALREADY RATED */}
          {!isTeacher && s.rating && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <p className="font-semibold text-yellow-700 mb-1">Your Rating</p>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map((star) => (
                  <span key={star} className={star <= s.rating ? "opacity-100" : "opacity-20"}>
                    ⭐
                  </span>
                ))}
              </div>
              {s.review && (
                <p className="text-sm text-yellow-700 italic">"{s.review}"</p>
              )}
            </div>
          )}

          {/* COMPLETE REMINDER for tutor */}
          {isTeacher && s.status === "scheduled" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-blue-700 mb-1">
                Mark session complete
              </p>
              <p className="text-xs text-blue-500 mb-3">
                Once you mark complete, credits will transfer automatically.
              </p>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-green-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition"
              >
                {completing ? "Completing..." : "✅ Mark Complete"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}