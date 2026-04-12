import { useEffect, useState } from "react";
import { useTutorStore } from "../store/tutorStore";
import { useAppointmentStore } from "../store/appointmentStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Tutors() {
  const { tutors, fetchTutors, loading } = useTutorStore();
  const { createDirect } = useAppointmentStore();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ subject: "", mode: "" });
  const [selected, setSelected] = useState(null); // tutor being booked
  const [form, setForm] = useState({ date: "", time: "", mode: "online", credits:"" });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleSearch = () => fetchTutors(filters);

  const openModal = (tutor) => {
    setSelected(tutor);
    setForm({ date: "", time: "", mode: "online" });
  };

  const handleBook = async () => {
    if (!form.date || !form.time) return toast.error("Pick date and time");
     if (!form.credits || form.credits <= 0) return toast.error("Enter credits to offer");
  if (Number(form.credits) > (user?.credits ?? 0)) {
    return toast.error("Not enough credits");
  }
    setBooking(true);
    try {
      await createDirect({
        tutorId: selected._id,
        date: form.date,
        time: form.time,
        mode: form.mode,
      });
      toast.success("Appointment sent! Waiting for tutor ⏳");
      setSelected(null);
      navigate("/appointments");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Find Tutors 🔍</h1>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Subject (DSA, Maths...)"
          value={filters.subject}
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={filters.mode}
          onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
          className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">All Modes</option>
          <option value="online">🟢 Online</option>
          <option value="offline">🟡 Offline</option>
        </select>
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-600 transition"
        >
          Search
        </button>
      </div>

      {/* TUTOR LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tutors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No tutors found</p>
          <p className="text-sm mt-1">Try different filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((tutor) => (
            <div key={tutor._id}
              className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">

                {/* LEFT — tutor info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {tutor.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">{tutor.username}</h2>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {tutor.subjects?.map((s) => (
                        <span key={s} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>
                        {tutor.mode?.map((m) => (
                          m === "online" ? "🟢 Online" : "🟡 Offline"
                        )).join(" · ")}
                      </span>
                      <span>·</span>
                      <span className={tutor.isOnline ? "text-green-500" : "text-gray-400"}>
                        {tutor.isOnline ? "● Available now" : "○ Offline"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-sm font-medium text-gray-700">
                        {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT — book button */}
                <button
                  onClick={() => openModal(tutor)}
                  className="bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition shrink-0"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">

            {/* Modal header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Book a Session
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  with <span className="font-medium text-blue-600">{selected.username}</span>
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                📅 Date
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Time */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                ⏰ Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Mode */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                📍 Mode
              </label>
              <div className="flex gap-3">
                {["online", "offline"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm({ ...form, mode: m })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                      form.mode === m
                        ? m === "online"
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {m === "online" ? "🟢 Online" : "🟡 Offline"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    💰 Credits to offer
                </label>
                <input
                    type="number"
                    min="1"
                    placeholder="How many credits?"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                    Your balance: {user?.credits ?? 0} credits
                </p>
                </div>

            {/* Summary */}
            {form.date && form.time && (
              <div className="bg-blue-50 rounded-xl p-3 mb-5 text-sm text-blue-700">
                📋 {selected.username} · {form.date} at {form.time} · {form.mode}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={booking || !form.date || !form.time}
                className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition"
              >
                {booking ? "Sending..." : "Send Request ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}