import { useState } from "react";
import { useRequestStore } from "../store/requestStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SUBJECTS = ["DSA", "Maths", "Physics", "DBMS", "OS", "CN", "ML", "Web Dev", "Other"];
const URGENCY  = [
  { value: "low",    label: "Low",    desc: "Anytime this week",  color: "border-green-300 bg-green-50 text-green-700"  },
  { value: "medium", label: "Medium", desc: "Within 2 days",      color: "border-yellow-300 bg-yellow-50 text-yellow-700" },
  { value: "high",   label: "High",   desc: "As soon as possible", color: "border-red-300 bg-red-50 text-red-700"   },
];

export default function PostRequest() {
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    subject: "",
    topic: "",
    description: "",
    urgency: "medium",
    maxCredits: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error("Pick a subject");
    if (!form.topic)   return toast.error("Enter the topic");
    if (!form.maxCredits || form.maxCredits <= 0) {
      return toast.error("Enter max credits");
    }

    setLoading(true);
    try {
      const req = await createRequest(form);
      toast.success("Request posted! 🔥");
      navigate(`/request/${req._id}`);
    } catch {
      toast.error("Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Post a Request</h1>
        <p className="text-gray-400 text-sm mt-1">
          Tutors will bid on your request in real time
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* SUBJECT CHIPS */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Subject *
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setForm({ ...form, subject: s })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                  form.subject === s
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {form.subject && (
            <p className="text-xs text-blue-500 mt-1">
              Selected: {form.subject}
            </p>
          )}
        </div>

        {/* TOPIC */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Topic *
          </label>
          <input
            placeholder="e.g. Binary Trees, Linked Lists..."
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Description
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            placeholder="Describe what you need help with..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
        </div>

        {/* URGENCY */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Urgency *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {URGENCY.map((u) => (
              <button
                type="button"
                key={u.value}
                onClick={() => setForm({ ...form, urgency: u.value })}
                className={`border-2 rounded-xl p-3 text-left transition ${
                  form.urgency === u.value
                    ? u.color
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <p className="font-semibold text-sm">{u.label}</p>
                <p className="text-xs mt-0.5 opacity-75">{u.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* MAX CREDITS */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Max Credits you'll pay *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              💰
            </span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={form.maxCredits}
              onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
              className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tutors will bid at or below this amount
          </p>
        </div>

        {/* PREVIEW */}
        {form.subject && form.topic && form.maxCredits && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-400 font-medium mb-1">Preview</p>
            <p className="font-bold text-gray-800">{form.subject} — {form.topic}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-gray-500">{form.urgency} urgency</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-blue-600 font-medium">
                up to {form.maxCredits} credits
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition"
        >
          {loading ? "Posting..." : "Post Request 🚀"}
        </button>
      </form>
    </div>
  );
}