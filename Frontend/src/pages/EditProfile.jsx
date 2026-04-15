import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import {
  User, BookOpen, MapPin, ChevronDown,
  Plus, X, Save, GraduationCap, Users
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

const SUBJECT_OPTIONS = ["DSA","Maths","Physics","DBMS","OS","CN","ML","Web Dev","Java","Python","C++","Other"];
const MODE_OPTIONS    = ["online", "offline"];

export default function EditProfile() {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username:       "",
    bio:            "",
    specialisation: "",
    role:           "student",
    subjects:       [],
    mode:           [],
    age:            "",
    gender:         "prefer_not",
    location:       "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      username:       user.username       ?? "",
      bio:            user.bio            ?? "",
      specialisation: user.specialisation ?? "",
      role:           user.role           ?? "student",
      subjects:       user.subjects       ?? [],
      mode:           user.mode           ?? [],
      age:            user.age            ?? "",
      gender:         user.gender         ?? "prefer_not",
      location:       user.location       ?? "",
    });
  }, [user]);

  const toggleSubject = (s) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(s)
        ? prev.subjects.filter((x) => x !== s)
        : [...prev.subjects, s],
    }));
  };

  const toggleMode = (m) => {
    setForm((prev) => ({
      ...prev,
      mode: prev.mode.includes(m)
        ? prev.mode.filter((x) => x !== m)
        : [...prev.mode, m],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error("Username required");
    setLoading(true);
    await updateProfile(form);
    setLoading(false);
  };

  const isTutorRole = form.role === "tutor" || form.role === "both";

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your information and preferences"
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ROLE SELECTOR */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Your Role
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            You can be a student, a tutor, or both — no restrictions.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "student", label: "Student",     icon: BookOpen,      desc: "I want to learn"    },
              { value: "tutor",   label: "Tutor",       icon: GraduationCap, desc: "I want to teach"    },
              { value: "both",    label: "Both",        icon: Users,         desc: "Learn and teach"    },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm({ ...form, role: value })}
                className={`border-2 rounded-xl p-3 text-left transition ${
                  form.role === value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                <Icon size={18} className={form.role === value ? "text-blue-600 mb-1" : "text-gray-400 mb-1"} />
                <p className={`font-semibold text-sm ${form.role === value ? "text-blue-700" : "text-gray-700"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* BASIC INFO */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-blue-500" /> Basic Info
          </h3>
          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Age</label>
                <input
                  type="number" min="13" max="100"
                  placeholder="Your age"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="prefer_not">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin size={13} /> Location
              </label>
              <input
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio</label>
              <textarea
                placeholder="Tell others about yourself..."
                value={form.bio}
                rows={3}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* TUTOR FIELDS — only when role is tutor or both */}
        {isTutorRole && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <GraduationCap size={16} className="text-blue-500" /> Tutor Details
            </h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Specialisation
              </label>
              <input
                placeholder="e.g. Competitive Programming, Data Science..."
                value={form.specialisation}
                onChange={(e) => setForm({ ...form, specialisation: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Subjects</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((s) => (
                  <button
                    type="button" key={s}
                    onClick={() => toggleSubject(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition ${
                      form.subjects.includes(s)
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Teaching Mode</label>
              <div className="flex gap-2">
                {MODE_OPTIONS.map((m) => (
                  <button
                    type="button" key={m}
                    onClick={() => toggleMode(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition capitalize ${
                      form.mode.includes(m)
                        ? m === "online"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Button type="submit" loading={loading} className="w-full py-3">
          <Save size={16} /> Save Profile
        </Button>
      </form>
    </div>
  );
}