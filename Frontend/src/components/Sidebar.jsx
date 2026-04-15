import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard, Search, Megaphone,
  Calendar, MessageSquare, Wallet, LogOut, ChevronRight, UserCircle
} from "lucide-react";
import Avatar from "./ui/Avatar";

const NAV = [
  { to: "/",             icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/tutors",       icon: Search,          label: "Find Tutors"  },
  { to: "/post-request", icon: Megaphone,       label: "Post Request" },
  { to: "/appointments", icon: Calendar,        label: "Appointments" },
  { to: "/sessions",     icon: MessageSquare,   label: "Sessions"     },
  { to: "/credits",      icon: Wallet,          label: "Credits"      },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-56px)] w-64 bg-white border-r border-gray-100 flex flex-col z-40">

      {/* USER */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar name={user.username} size="md" />
          <div className="overflow-hidden flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{user.username}</p>
            <p className="text-xs text-gray-400">{user.isTutor ? "Tutor & Student" : "Student"}</p>
          </div>
        </div>

        <Link
          to="/credits"
          className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 hover:bg-blue-100 transition group"
        >
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-blue-500" />
            <span className="text-xs text-blue-600 font-medium">Credits</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-blue-600">{user.credits ?? 0}</span>
            <ChevronRight size={12} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={17} className={active ? "text-white" : "text-gray-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-0.5">
  <Link
    to="/profile/edit"
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
      pathname === "/profile/edit"
        ? "bg-blue-600 text-white shadow-sm"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <UserCircle size={17} className={pathname === "/profile/edit" ? "text-white" : "text-gray-500"} />
    Edit Profile
  </Link>
  <button
    onClick={async () => { await logout(); navigate("/login"); }}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
  >
    <LogOut size={17} /> Logout
  </button>
</div>
    </aside>
  );
}