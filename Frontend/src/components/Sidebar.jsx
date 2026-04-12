import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const NAV = [
  { to: "/",              icon: "🏠", label: "Dashboard"    },
  { to: "/tutors",        icon: "🔍", label: "Find Tutors"  },
  { to: "/post-request",  icon: "📢", label: "Post Request" },
  { to: "/appointments",  icon: "📅", label: "Appointments" },
  { to: "/sessions",      icon: "💬", label: "Sessions"     },
  { to: "/credits",       icon: "💰", label: "Credits"      },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-[53px] h-[calc(100vh-53px)] w-56 bg-white border-r flex flex-col z-40">

      {/* USER INFO */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-400">
              {user.isTutor ? "Tutor & Student" : "Student"}
            </p>
          </div>
        </div>

        {/* CREDITS PILL */}
        <Link
          to="/credits"
          className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 hover:bg-blue-100 transition"
        >
          <span className="text-xs text-blue-500 font-medium">Credits</span>
          <span className="text-sm font-bold text-blue-600">{user.credits ?? 0}</span>
        </Link>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM — logout */}
      <div className="px-3 py-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}