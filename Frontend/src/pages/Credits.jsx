import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { Wallet, Zap, Info, CreditCard, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

const PACKAGES = [
  { amount: 5,  price: "₹49",  label: "Starter", popular: false },
  { amount: 10, price: "₹99",  label: "Basic",   popular: true  },
  { amount: 25, price: "₹199", label: "Pro",      popular: false },
  { amount: 50, price: "₹349", label: "Power",    popular: false },
];

const HOW_IT_WORKS = [
  { icon: Zap,        text: "Post a request — tutors bid with their credit price" },
  { icon: CreditCard, text: "Accept a bid — credits held until session completes" },
  { icon: TrendingUp, text: "Session complete — credits transfer to tutor automatically" },
];

export default function Credits() {
  const { user, topUpCredits, refreshUser } = useAuthStore();
  const { socket, connect, emit } = useSocketStore();
  const [loading, setLoading] = useState(null);
  const [custom, setCustom]   = useState("");

  useEffect(() => {
    connect();
    if (!socket || !user) return;
    emit("joinUserRoom", user._id);
    socket.on("creditsUpdated", ({ message }) => {
      toast.success(message);
      refreshUser();
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
    if (!amt || amt < 1)    return toast.error("Enter a valid amount");
    if (amt > 1000)          return toast.error("Max 1000 credits at once");
    await handleTopUp(amt);
    setCustom("");
  };

  const pct = Math.min(((user?.credits ?? 0) / 100) * 100, 100);

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <PageHeader title="Credits" subtitle="Manage your learning credits" />

      {/* BALANCE */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Current Balance</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-5xl font-bold">{user?.credits ?? 0}</span>
              <span className="text-blue-200 mb-1">credits</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet size={26} className="text-white" />
          </div>
        </div>
        <p className="text-blue-100 text-xs mb-3">1 credit ≈ ₹10</p>
        <div>
          <div className="flex justify-between text-xs text-blue-200 mb-1.5">
            <span>Balance</span><span>{user?.credits ?? 0} / 100</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-blue-500" />
          <h3 className="font-semibold text-gray-800 text-sm">How credits work</h3>
        </div>
        <div className="space-y-3">
          {HOW_IT_WORKS.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-blue-500" />
              </div>
              <p className="text-sm text-gray-600 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* PACKAGES */}
      <h3 className="font-semibold text-gray-800 mb-3">Add Credits</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.amount}
            onClick={() => handleTopUp(pkg.amount)}
            disabled={loading === pkg.amount}
            className={`relative border-2 rounded-2xl p-4 text-left transition hover:shadow-md disabled:opacity-50 ${
              pkg.popular
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-200"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <p className={`text-2xl font-bold ${pkg.popular ? "text-blue-600" : "text-gray-800"}`}>
              {loading === pkg.amount ? "..." : `+${pkg.amount}`}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{pkg.label}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{pkg.price}</p>
          </button>
        ))}
      </div>

      {/* CUSTOM */}
      <Card>
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Custom amount</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="1 – 1000 credits"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button onClick={handleCustom} loading={loading === parseInt(custom)}>
            Add
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <CreditCard size={11} /> Razorpay / Stripe integration coming soon
        </p>
      </Card>
    </div>
  );
}