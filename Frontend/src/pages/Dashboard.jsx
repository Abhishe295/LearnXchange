import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useRequestStore } from "../store/requestStore";
import { useAppointmentStore } from "../store/appointmentStore";
import { Link } from "react-router-dom";
import { Search, Megaphone, Clock, CheckCircle, Wallet, ChevronRight, Bell } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import { SkeletonList } from "../components/ui/LoadingSkeleton";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { requests, fetchRequests, loading } = useRequestStore();
  const { appointments, sessions, fetchAppointments, fetchSessions } = useAppointmentStore();

  useEffect(() => {
    fetchRequests();
    fetchAppointments();
    fetchSessions();
  }, []);

  const pendingAppts       = appointments.filter((a) => a.status === "pending");
  const scheduledSessions  = sessions.filter((s) => s.status === "scheduled");
  const completedSessions  = sessions.filter((s) => s.status === "completed");

  const myIncomingAppts = pendingAppts.filter(
    (a) => (a.teacherId?._id ?? a.teacherId) === user?._id
  );

  const stats = [
    { label: "Credits",   value: user?.credits ?? 0, icon: Wallet,       color: "text-blue-600",   bg: "bg-blue-50",   link: "/credits"      },
    { label: "Pending",   value: pendingAppts.length, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50", link: "/appointments" },
    { label: "Sessions",  value: scheduledSessions.length, icon: Bell,    color: "text-purple-600", bg: "bg-purple-50", link: "/sessions"     },
    { label: "Completed", value: completedSessions.length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", link: "/sessions"  },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* WELCOME */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey, {user?.username} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.isTutor ? "You're active as student and tutor" : "Find a tutor or post a request"}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link}
            className={`${bg} rounded-2xl p-4 flex flex-col gap-2 hover:shadow-md transition-all border border-transparent hover:border-gray-100`}>
            <Icon size={20} className={color} />
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs font-medium text-gray-500">{label}</span>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link to="/tutors"
          className="group bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 transition-all">
          <Search size={22} className="mb-3 opacity-80" />
          <p className="font-semibold">Find Tutors</p>
          <p className="text-xs text-blue-100 mt-0.5">Book a direct session</p>
        </Link>
        <Link to="/post-request"
          className="group bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-5 transition-all">
          <Megaphone size={22} className="mb-3 opacity-80" />
          <p className="font-semibold">Post Request</p>
          <p className="text-xs text-purple-100 mt-0.5">Let tutors bid for you</p>
        </Link>
      </div>

      {/* INCOMING APPOINTMENTS — tutor view */}
      {myIncomingAppts.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell size={16} className="text-yellow-500" />
              Incoming Requests
            </h2>
            <Link to="/appointments" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {myIncomingAppts.slice(0, 3).map((a) => (
              <Link to="/appointments" key={a._id}>
                <Card hover className="!p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.studentId?.username} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.studentId?.username}</p>
                        <p className="text-xs text-gray-400">{a.date} at {a.time} · {a.mode}</p>
                      </div>
                    </div>
                    <Badge variant="yellow">Pending</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* OPEN REQUESTS */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-800">Open Requests</h2>
          <Link to="/post-request" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            + New <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : requests.length === 0 ? (
          <Card className="text-center py-10">
            <Megaphone size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No open requests yet</p>
            <Link to="/post-request" className="text-xs text-blue-600 mt-2 inline-block hover:underline">
              Post one →
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 5).map((req) => (
              <Link key={req._id} to={`/request/${req._id}`}>
                <Card hover className="!p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{req.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{req.topic} · by {req.studentId?.username}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={req.urgency === "high" ? "red" : req.urgency === "medium" ? "yellow" : "green"}>
                        {req.urgency}
                      </Badge>
                      <span className="text-sm font-bold text-blue-600">{req.maxCredits} cr</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}