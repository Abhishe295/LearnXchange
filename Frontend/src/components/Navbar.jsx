import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import Avatar from "./ui/Avatar";

export default function Navbar() {
  const { user } = useAuthStore();
  const { notifications, markRead, clearAll } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-50 flex items-center justify-between px-6">

      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">LX</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">LearnXchange</span>
      </Link>

      {user ? (
        <div className="flex items-center gap-2">

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
            >
              <Bell size={18} className="text-gray-600" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifs(false)}
                />
                <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition"
                      >
                        <CheckCheck size={12} /> Clear all
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">
                      <Bell size={24} className="mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markRead(n.id);
                            if (n.sessionId) navigate(`/session/${n.sessionId}`);
                            setShowNotifs(false);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition flex justify-between items-start gap-2 ${
                            !n.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <Avatar name={user.username} size="sm" />
        </div>
      ) : (
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          Get Started
        </Link>
      )}
    </header>
  );
}