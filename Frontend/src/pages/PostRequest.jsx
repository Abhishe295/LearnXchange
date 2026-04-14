import { useState } from "react";
import { useRequestStore } from "../store/requestStore";
import { useNavigate } from "react-router-dom";
import { Wallet, AlertCircle, Zap } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";

const SUBJECTS = ["DSA","Maths","Physics","DBMS","OS","CN","ML","Web Dev","Other"];
const URGENCY = [
  { value: "low",    label: "Low",    desc: "Anytime this week",   active: "border-green-500 bg-green-50 text-green-700"   },
  { value: "medium", label: "Medium", desc: "Within 2 days",       active: "border-yellow-500 bg-yellow-50 text-yellow-700" },
  { value: "high",   label: "High",   desc: "As soon as possible", active: "border-red-500 bg-red-50 text-red-700"          },
];

export default function PostRequest() {
  const { createRequest } = useRequestStore();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ subject: "", topic: "", description: "", urgency: "medium", maxCredits: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject)    return toast.error("Pick a subject");
    if (!form.topic)      return toast.error("Enter the topic");
    if (!form.maxCredits) return toast.error("Enter max credits");
    setLoading(true);
    try {
      const req = await createRequest(form);
      toast.success("Request posted!");
      navigate(`/request/${req._id}`);
    } catch {
      toast.error("Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <PageHeader
        title="Post a Request"
        subtitle="Tutors will bid on your request in real time"
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SUBJECT */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Subject *</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button type="button" key={s}
                onClick={() => setForm({ ...form, subject: s })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                  form.subject === s
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-blue-300 bg-white"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TOPIC */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Topic *</label>
          <input
            placeholder="e.g. Binary Trees, Discrete Math..."
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Describe what you need help with..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* URGENCY */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Urgency *</label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY.map((u) => (
              <button type="button" key={u.value}
                onClick={() => setForm({ ...form, urgency: u.value })}
                className={`border-2 rounded-xl p-3 text-left transition ${
                  form.urgency === u.value ? u.active : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                }`}>
                <p className="font-semibold text-sm">{u.label}</p>
                <p className="text-xs mt-0.5 opacity-75">{u.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* MAX CREDITS */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Max Credits *</label>
          <div className="relative">
            <Wallet size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number" min="1"
              placeholder="e.g. 5"
              value={form.maxCredits}
              onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Tutors will bid at or below this amount</p>
        </div>

        {/* PREVIEW */}
        {form.subject && form.topic && form.maxCredits && (
          <Card className="!bg-blue-50 !border-blue-100">
            <div className="flex items-start gap-2">
              <Zap size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-blue-500 font-medium mb-0.5">Preview</p>
                <p className="font-semibold text-gray-800 text-sm">{form.subject} — {form.topic}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.urgency} urgency · up to {form.maxCredits} credits
                </p>
              </div>
            </div>
          </Card>
        )}

        <Button type="submit" loading={loading} className="w-full py-3">
          Post Request
        </Button>
      </form>
    </div>
  );
}