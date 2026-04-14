import { useEffect } from "react";
import { useAppointmentStore } from "../store/appointmentStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Video, Calendar, Clock, ChevronRight } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { SkeletonList } from "../components/ui/LoadingSkeleton";

export default function Sessions() {
  const { sessions, fetchSessions } = useAppointmentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { fetchSessions(); }, []);

  const scheduled = sessions.filter((s) => s.status === "scheduled");
  const completed  = sessions.filter((s) => s.status === "completed");

  const SessionCard = ({ s }) => {
    const isTeacher = (s.teacherId?._id ?? s.teacherId) === user?._id;
    const other     = isTeacher ? s.studentId : s.teacherId;

    return (
      <Card hover onClick={() => navigate(`/session/${s._id}`)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={other?.username} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{other?.username}</p>
              <p className="text-xs text-gray-400">{isTeacher ? "Student" : "Your Tutor"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={s.status === "scheduled" ? "blue" : "gray"}>
              {s.status === "scheduled" ? "Scheduled" : "Completed"}
            </Badge>
            <Badge variant={s.mode === "online" ? "green" : "yellow"}>
              {s.mode === "online" ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-gray-400" /> {s.date ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" /> {s.time ?? "—"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
              <MessageSquare size={11} /> Chat
            </span>
            {s.mode === "online" && s.status === "scheduled" && (
              <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg">
                <Video size={11} /> Video
              </span>
            )}
          </div>
          <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
            Open <ChevronRight size={12} />
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <PageHeader
        title="My Sessions"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} total`}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No sessions yet"
          subtitle="Accept an appointment to start a session"
        />
      ) : (
        <>
          {scheduled.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Upcoming · {scheduled.length}
              </h2>
              <div className="space-y-3">
                {scheduled.map((s) => <SessionCard key={s._id} s={s} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Completed · {completed.length}
              </h2>
              <div className="space-y-3 opacity-75">
                {completed.map((s) => <SessionCard key={s._id} s={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}