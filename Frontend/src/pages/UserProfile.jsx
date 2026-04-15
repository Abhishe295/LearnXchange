import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import {
  Star, MapPin, BookOpen, Users, CheckCircle,
  GraduationCap, Calendar, ArrowLeft, Wifi, WifiOff
} from "lucide-react";
import Card from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { SkeletonList } from "../components/ui/LoadingSkeleton";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate   = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/users/profile/${userId}`);
        setData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-6 py-8"><SkeletonList count={3} /></div>
  );

  if (!data) return (
    <div className="max-w-2xl mx-auto px-6 py-8 text-center text-gray-400 py-16">
      User not found
    </div>
  );

  const { user, sessionsCompleted, recentRatings } = data;
  const isTutor = user.role === "tutor" || user.role === "both";

  const renderStars = (rating, size = 16) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={size} className={
          s <= Math.round(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-200"
        } />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* PROFILE HERO */}
      <Card className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.username} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={
                  user.role === "both"   ? "purple" :
                  user.role === "tutor"  ? "blue"   : "green"
                }>
                  {user.role === "both"   ? "Tutor & Student" :
                   user.role === "tutor"  ? "Tutor" : "Student"}
                </Badge>
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  user.isOnline ? "text-green-500" : "text-gray-400"
                }`}>
                  {user.isOnline
                    ? <><Wifi size={11} /> Online</>
                    : <><WifiOff size={11} /> Offline</>
                  }
                </span>
              </div>
              {user.location && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin size={11} /> {user.location}
                </p>
              )}
            </div>
          </div>

          {isTutor && user.rating > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {renderStars(user.rating, 18)}
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user.rating.toFixed(1)}</p>
              <p className="text-xs text-gray-400">{user.totalRatings} rating{user.totalRatings !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{user.bio}</p>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle, label: "Sessions",       value: sessionsCompleted, color: "text-green-500"  },
            { icon: Star,        label: "Avg Rating",     value: isTutor && user.rating > 0 ? user.rating.toFixed(1) : "—", color: "text-yellow-500" },
            { icon: Users,       label: "Total Ratings",  value: user.totalRatings ?? 0, color: "text-blue-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon size={18} className={`mx-auto mb-1 ${color}`} />
              <p className="font-bold text-gray-900 text-lg">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* TUTOR DETAILS */}
      {isTutor && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-500" /> Teaching
          </h2>

          {user.specialisation && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Specialisation</p>
              <p className="text-sm font-medium text-gray-700">{user.specialisation}</p>
            </div>
          )}

          {user.subjects?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {user.subjects.map((s) => (
                  <Badge key={s} variant="blue">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {user.mode?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Teaching Mode</p>
              <div className="flex gap-2">
                {user.mode.map((m) => (
                  <Badge key={m} variant={m === "online" ? "green" : "yellow"}>
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ABOUT */}
      {(user.age || user.gender !== "prefer_not") && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> About
          </h2>
          <div className="space-y-2">
            {user.age && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Age</span>
                <span className="text-gray-700 font-medium">{user.age}</span>
              </div>
            )}
            {user.gender && user.gender !== "prefer_not" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gender</span>
                <span className="text-gray-700 font-medium capitalize">{user.gender}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Member since</span>
              <span className="text-gray-700 font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* RECENT RATINGS */}
      {isTutor && recentRatings?.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Recent Reviews
          </h2>
          <div className="space-y-4">
            {recentRatings.map((r, i) => (
              <div key={i} className={`${i !== 0 ? "pt-4 border-t border-gray-100" : ""}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.studentId?.username} size="sm" color="green" />
                    <span className="text-sm font-medium text-gray-800">
                      {r.studentId?.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(r.rating, 13)}
                    <span className="text-xs text-gray-400">
                      {new Date(r.ratedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {r.review && (
                  <p className="text-sm text-gray-600 italic ml-8">"{r.review}"</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* BOOK BUTTON — for tutors */}
      {isTutor && (
        <div className="mt-4">
          <Button
            className="w-full py-3"
            onClick={() => navigate(`/tutors`)}
          >
            <BookOpen size={16} /> Book a Session
          </Button>
        </div>
      )}
    </div>
  );
}