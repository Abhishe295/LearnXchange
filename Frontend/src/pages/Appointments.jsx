import { useEffect } from "react";
import { useAppointmentStore } from "../store/appointmentStore";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, ChevronRight, Check, X, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";

export default function Appointments() {
  const { appointments, fetchAppointments, accept, reject } = useAppointmentStore();
  const { user } = useAuthStore();
  const { socket, connect, emit } = useSocketStore();
  const navigate = useNavigate();

  useEffect(() => {
    connect();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    emit("joinUserRoom", user._id);
    socket.on("appointmentAccepted", () => {
      toast.success("Tutor accepted your appointment!");
      fetchAppointments();
    });
    return () => socket.off("appointmentAccepted");
  }, [socket, user]);

  const handleAccept = async (id) => {
    const session = await accept(id);
    if (session) { toast.success("Session created!"); fetchAppointments(); }
  };

  const handleReject = async (id) => {
    await reject(id);
    toast("Appointment rejected", { icon: "❌" });
  };

  const pending   = appointments.filter((a) => a.status === "pending");
  const accepted  = appointments.filter((a) => a.status === "accepted");
  const rejected  = appointments.filter((a) => a.status === "rejected");

  const Section = ({ title, items }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h2>
        <div className="space-y-3">
          {items.map((a) => {
            const isTutor  = (a.teacherId?._id ?? a.teacherId) === user?._id;
            const isStudent = (a.studentId?._id ?? a.studentId) === user?._id;
            const other    = isTutor ? a.studentId : a.teacherId;

            return (
              <Card key={a._id} className={
                a.status === "accepted" ? "!border-green-200 !bg-green-50/30" :
                a.status === "rejected" ? "opacity-50" : ""
              }>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={other?.username} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{other?.username}</p>
                      <p className="text-xs text-gray-400">{isTutor ? "Student" : "Your Tutor"}</p>
                    </div>
                  </div>
                  <Badge variant={
                    a.status === "pending"  ? "yellow" :
                    a.status === "accepted" ? "green"  : "red"
                  }>
                    {a.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" /> {a.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" /> {a.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="capitalize">{a.mode}</span>
                  </span>
                  {a.credits > 0 && (
                    <span className="font-medium text-blue-600">{a.credits} credits</span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {isTutor && a.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleAccept(a._id)}>
                        <Check size={14} /> Accept
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(a._id)}>
                        <X size={14} /> Reject
                      </Button>
                    </>
                  )}
                  {isStudent && a.status === "pending" && (
                    <span className="text-xs text-yellow-600 font-medium flex items-center gap-1.5">
                      <Clock size={12} /> Waiting for tutor...
                    </span>
                  )}
                  {a.status === "accepted" && a.sessionId && (
                    <Button size="sm" onClick={() => navigate(`/session/${a.sessionId}`)}>
                      Open Session <ChevronRight size={14} />
                    </Button>
                  )}
                  {a.status === "rejected" && (
                    <span className="text-xs text-red-400">This appointment was declined.</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <PageHeader title="Appointments" subtitle="Manage your incoming and outgoing session requests" />

      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          subtitle="Book a tutor or post a request to get started"
          action={<Button onClick={() => navigate("/tutors")} size="sm">Find Tutors</Button>}
        />
      ) : (
        <>
          <Section title={`Pending · ${pending.length}`} items={pending} />
          <Section title={`Accepted · ${accepted.length}`} items={accepted} />
          <Section title={`Rejected · ${rejected.length}`} items={rejected} />
        </>
      )}
    </div>
  );
}