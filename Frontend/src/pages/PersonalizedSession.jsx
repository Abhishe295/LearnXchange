import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import { useAppointmentStore } from "../store/appointmentStore";
import {
  Video, MessageSquare, Info, Send, Star,
  Calendar, Clock, CheckCircle, MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/LoadingSkeleton";

export default function PersonalizedSession() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user, refreshUser }   = useAuthStore();
  const { currentSession, fetchSessionById, loadingSession,
          completeSession, rateSession } = useAppointmentStore();
  const { messages, sendMessage, joinSession,
          listenMessages, stopListening } = useChatStore();
  const { connect, socket, emit } = useSocketStore();

  const [text, setText]                     = useState("");
  const [tab, setTab]                       = useState("chat");
  const [completing, setCompleting]         = useState(false);
  const [rating, setRating]                 = useState(0);
  const [hover, setHover]                   = useState(0);
  const [review, setReview]                 = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const bottomRef = useRef(null);

  const s         = currentSession;
  const isTeacher = s?.teacherId?._id === user?._id || s?.teacherId === user?._id;
  const other     = s ? (isTeacher ? s.studentId : s.teacherId) : null;

  useEffect(() => {
    fetchSessionById(id);
    connect();
    const t = setTimeout(() => { joinSession(id); listenMessages(); }, 200);
    return () => { stopListening(); useChatStore.getState().clear(); clearTimeout(t); };
  }, [id]);

  useEffect(() => {
    if (!socket || !user) return;
    emit("joinUserRoom", user._id);
    socket.on("creditsUpdated", ({ message }) => { toast.success(message); refreshUser(); });
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
      toast.success("Session complete! Credits transferred");
    } catch { toast.error("Failed to complete session"); }
    finally { setCompleting(false); }
  };

  const handleRate = async () => {
    if (!rating) return toast.error("Pick a star rating");
    setSubmittingRating(true);
    try {
      await rateSession(id, { rating, review });
      toast.success("Thanks for the feedback!");
    } catch { toast.error("Failed to submit rating"); }
    finally { setSubmittingRating(false); }
  };

  if (loadingSession) return (
    <div className="max-w-2xl mx-auto px-6 py-8"><SkeletonList count={3} /></div>
  );

  if (!s) return (
    <div className="max-w-2xl mx-auto px-6 py-8 text-center py-16 text-gray-400">
      Session not found
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

      {/* HERO */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={other?.username} size="lg" />
            <div>
              <p className="font-bold text-gray-900 text-lg">{other?.username}</p>
              <p className="text-xs text-gray-400">{isTeacher ? "Student" : "Your Tutor"}</p>
              {!isTeacher && s.teacherId?.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-medium text-gray-600">
                    {s.teacherId.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={s.status === "scheduled" ? "blue" : "green"}>
              {s.status === "scheduled" ? "Scheduled" : "Completed"}
            </Badge>
            <Badge variant={s.mode === "online" ? "green" : "yellow"}>
              {s.mode}
            </Badge>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-700">
            <Calendar size={14} className="text-gray-400" />
            {s.date ?? "—"}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-700">
            <Clock size={14} className="text-gray-400" />
            {s.time ?? "—"}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-700">
            <MapPin size={14} className="text-gray-400" />
            <span className="capitalize">{s.mode}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {s.mode === "online" && s.status === "scheduled" && (
            <Button onClick={() => navigate(`/session/${id}/call`)}>
              <Video size={15} /> Join Video Call
            </Button>
          )}
          {isTeacher && s.status === "scheduled" && (
            <Button variant="secondary" loading={completing} onClick={handleComplete}>
              <CheckCircle size={15} /> Mark Complete
            </Button>
          )}
        </div>
      </Card>

      {/* TABS */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: "chat", icon: MessageSquare, label: "Chat" },
          { key: "info", icon: Info,          label: "Info" },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* CHAT TAB */}
      {tab === "chat" && (
        <Card className="!p-0 flex flex-col" style={{ height: "440px" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="font-semibold text-gray-800 text-sm">Chat with {other?.username}</p>
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</p>
            )}
            {messages.map((m, i) => {
              const isMe = m.senderId === user?._id || m.senderId?._id === user?._id;
              return (
                <div key={i} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {other?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                    {!isMe && <p className="text-xs font-semibold text-blue-500 mb-1">{other?.username}</p>}
                    <p>{m.text}</p>
                    <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} disabled={!text.trim()}
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition">
              <Send size={15} />
            </button>
          </div>
        </Card>
      )}

      {/* INFO TAB */}
      {tab === "info" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Session Details</h3>
            {[
              ["Session ID", <span className="font-mono text-xs">{s._id?.slice(-8)}</span>],
              ["Mode",       <span className="capitalize">{s.mode}</span>],
              ["Date",       s.date ?? "—"],
              ["Time",       s.time ?? "—"],
              ["Status",     <span className="capitalize font-medium">{s.status}</span>],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs text-gray-700">{value}</span>
              </div>
            ))}
          </Card>

          {/* RATE SESSION */}
          {!isTeacher && s.status === "completed" && !s.rating && (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">Rate this session</h3>
              <p className="text-xs text-gray-400 mb-4">Help other students find great tutors</p>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((star) => (
                  <button key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition hover:scale-110">
                    <Star size={28} className={`${
                      star <= (hover || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    } transition-colors`} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Leave a review (optional)..."
                value={review} onChange={(e) => setReview(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
              />
              <Button
                onClick={handleRate}
                loading={submittingRating}
                disabled={!rating}
                className="w-full py-2.5"
                variant="primary"
              >
                <Star size={15} /> Submit Rating
              </Button>
            </Card>
          )}

          {!isTeacher && s.rating && (
            <Card className="!bg-yellow-50 !border-yellow-100">
              <p className="font-semibold text-yellow-800 mb-2 text-sm">Your Rating</p>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} size={18} className={
                    star <= s.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                  } />
                ))}
              </div>
              {s.review && <p className="text-sm text-yellow-700 italic">"{s.review}"</p>}
            </Card>
          )}

          {isTeacher && s.status === "scheduled" && (
            <Card className="!bg-blue-50 !border-blue-100">
              <p className="font-semibold text-blue-800 text-sm mb-1">Mark session complete</p>
              <p className="text-xs text-blue-500 mb-3">Credits transfer automatically on completion.</p>
              <Button loading={completing} onClick={handleComplete}>
                <CheckCircle size={15} /> Mark Complete
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}