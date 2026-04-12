import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const { user } = useAuthStore();
  const { notifications, markRead, clearAll } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex justify-between items-center px-6 py-3 bg-white border-b sticky top-0 z-50">

      {/* LOGO */}
      <Link to="/" className="text-xl font-bold text-blue-600">
        LearnXchange
      </Link>

      {/* RIGHT */}
      {user && (
        <div className="flex items-center gap-3">

          {/* NOTIFICATION BELL */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <span className="text-lg">🔔</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-red-400"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No notifications yet 🔕
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          if (n.sessionId) navigate(`/session/${n.sessionId}`);
                          setShowNotifs(false);
                        }}
                        className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition ${
                          !n.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <p className="text-sm text-gray-700">{n.message}</p>
                        {!n.read && (
                          <span className="text-xs text-blue-400 font-medium">New</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AVATAR */}
          <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition">
            {user.username?.charAt(0).toUpperCase()}
          </Link>
        </div>
      )}

      {!user && (
        <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
          Login
        </Link>
      )}
    </div>
  );
}