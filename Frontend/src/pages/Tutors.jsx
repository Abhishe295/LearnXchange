import { useEffect, useState } from "react";
import { useTutorStore } from "../store/tutorStore";
import { useAppointmentStore } from "../store/appointmentStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Search, Star, Wifi, WifiOff, X, Calendar, Clock, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { SkeletonList } from "../components/ui/LoadingSkeleton";

export default function Tutors() {
  const { tutors, fetchTutors, loading } = useTutorStore();
  const { createDirect }                 = useAppointmentStore();
  const { user }                         = useAuthStore();
  const navigate                         = useNavigate();

  const [filters, setFilters] = useState({ subject: "", mode: "" });
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ date: "", time: "", mode: "online", credits: "" });
  const [booking, setBooking]   = useState(false);

  useEffect(() => { fetchTutors(); }, []);

  const openModal = (tutor) => {
    setSelected(tutor);
    setForm({ date: "", time: "", mode: "online", credits: "" });
  };

  const handleBook = async () => {
    if (!form.date || !form.time)              return toast.error("Pick date and time");
    if (!form.credits || form.credits <= 0)    return toast.error("Enter credits to offer");
    if (Number(form.credits) > (user?.credits ?? 0)) return toast.error("Not enough credits");
    setBooking(true);
    try {
      await createDirect({ tutorId: selected._id, ...form });
      toast.success("Appointment sent!");
      setSelected(null);
      navigate("/appointments");
    } catch { toast.error("Something went wrong"); }
    finally { setBooking(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PageHeader title="Find Tutors" subtitle="Browse and book from our verified tutors" />

      {/* FILTERS */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by subject..."
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select
          value={filters.mode}
          onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Modes</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <Button onClick={() => fetchTutors(filters)}>Search</Button>
      </div>

      {/* LIST */}
      {loading ? <SkeletonList count={3} /> :
       tutors.length === 0 ? (
         <EmptyState icon={Search} title="No tutors found" subtitle="Try different filters" />
       ) : (
        <div className="space-y-3">
          {tutors.map((tutor) => (
            <Card key={tutor._id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar name={tutor.username} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900">{tutor.username}</h2>
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        tutor.isOnline ? "text-green-500" : "text-gray-400"
                      }`}>
                        {tutor.isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                        {tutor.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tutor.subjects?.map((s) => (
                        <Badge key={s} variant="blue">{s}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} size={13} className={
                            star <= Math.round(tutor.rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200"
                          } />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {tutor.rating > 0 ? tutor.rating.toFixed(1) : "No ratings"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {tutor.mode?.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => openModal(tutor)}>Book</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Book a Session</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  with <span className="font-medium text-blue-600">{selected.username}</span>
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} /> Date
                </label>
                <input type="date" value={form.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} /> Time
                </label>
                <input type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Mode</label>
                <div className="flex gap-2">
                  {["online", "offline"].map((m) => (
                    <button key={m} onClick={() => setForm({ ...form, mode: m })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                        form.mode === m
                          ? m === "online"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-yellow-500 bg-yellow-50 text-yellow-700"
                          : "border-gray-200 text-gray-500"
                      }`}>
                      {m === "online" ? "Online" : "Offline"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5 flex items-center gap-1.5">
                  <Wallet size={14} /> Credits to offer
                </label>
                <input type="number" min="1" placeholder="How many credits?"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">Your balance: {user?.credits ?? 0} credits</p>
              </div>
            </div>

            {form.date && form.time && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 mt-4 text-sm text-blue-700">
                {selected.username} · {form.date} at {form.time} · {form.mode} · {form.credits || "?"} credits
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="secondary" className="flex-1 py-2.5" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 py-2.5"
                loading={booking}
                disabled={!form.date || !form.time || !form.credits}
                onClick={handleBook}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}