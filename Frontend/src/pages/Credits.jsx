import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

const PACKAGES = [
  { amount: 5,   price: "₹49",  label: "Starter",  color: "border-gray-200 hover:border-blue-300" },
  { amount: 10,  price: "₹99",  label: "Basic",    color: "border-blue-300 bg-blue-50", popular: true },
  { amount: 25,  price: "₹199", label: "Pro",       color: "border-gray-200 hover:border-purple-300" },
  { amount: 50,  price: "₹349", label: "Power",     color: "border-gray-200 hover:border-green-300" },
];

export default function Credits() {
  const { user, topUpCredits, refreshUser } = useAuthStore();
  const { socket, connect, emit } = useSocketStore();
  const [loading, setLoading] = useState(null);
  const [custom, setCustom] = useState("");

  // Listen for credit updates from server (after session complete)
  useEffect(() => {
    connect();
    if (!socket || !user) return;

    emit("joinUserRoom", user._id);

    socket.on("creditsUpdated", ({ message }) => {
      toast.success(message);
      refreshUser(); // pull latest credits from server
    });

    return () => socket.off("creditsUpdated");
  }, [socket, user]);

  const handleTopUp = async (amount) => {
    setLoading(amount);
    await topUpCredits(amount);
    setLoading(null);
  };

  const handleCustom = async () => {
    const amt = parseInt(custom);
    if (!amt || amt < 1) return toast.error("Enter a valid amount");
    if (amt > 1000) return toast.error("Max 1000 credits at once");
    await handleTopUp(amt);
    setCustom("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">

      {/* BALANCE CARD */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <p className="text-blue-100 text-sm font-medium mb-1">Current Balance</p>
        <div className="flex items-end gap-2">
          <p className="text-5xl font-bold">{user?.credits ?? 0}</p>
          <p className="text-blue-200 mb-1 text-lg">credits</p>
        </div>
        <p className="text-blue-100 text-xs mt-3">
          1 credit ≈ ₹10 · Used for booking tutoring sessions
        </p>

        {/* PROGRESS BAR — visual only */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>Balance</span>
            <span>{user?.credits}/100</span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min((user?.credits / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* HOW CREDITS WORK */}
      <div className="bg-gray-50 rounded-xl border p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">How credits work</h3>
        <div className="space-y-2">
          {[
            { icon: "📢", text: "Post a request — tutors bid with their credit price" },
            { icon: "✅", text: "Accept a bid — credits are held until session completes" },
            { icon: "🎓", text: "Session complete — credits transfer from student to tutor" },
            { icon: "👨‍🏫", text: "Tutors earn credits — withdraw as cash in future" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP UP PACKAGES */}
      <h2 className="font-semibold text-gray-700 mb-4">Add Credits</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.amount}
            onClick={() => handleTopUp(pkg.amount)}
            disabled={loading === pkg.amount}
            className={`relative border-2 rounded-xl p-4 text-left transition ${pkg.color} disabled:opacity-50`}
          >
            {pkg.popular && (
              <span className="absolute -top-2 right-3 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <p className="text-2xl font-bold text-gray-800">
              {loading === pkg.amount ? "..." : `+${pkg.amount}`}
            </p>
            <p className="text-sm text-gray-500">{pkg.label}</p>
            <p className="text-xs text-gray-400 mt-1">{pkg.price}</p>
          </button>
        ))}
      </div>

      {/* CUSTOM AMOUNT */}
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Custom amount</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Enter credits (1–1000)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleCustom}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💳 Real payment integration coming soon
        </p>
      </div>

      {/* FUTURE NOTE */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-700 font-medium">🚧 Payment integration coming soon</p>
        <p className="text-xs text-yellow-600 mt-1">
          Credits are currently free for testing. Real payments via Razorpay/Stripe will be added soon.
        </p>
      </div>
    </div>
  );
}