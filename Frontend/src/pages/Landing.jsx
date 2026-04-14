import { Link } from "react-router-dom";
import { ArrowRight, Star, Zap, Shield, Users, BookOpen, TrendingUp } from "lucide-react";

const FEATURES = [
  { icon: Zap,       title: "Real-time Bidding",  desc: "Post a request and watch tutors compete for your session in real time." },
  { icon: Users,     title: "Direct Booking",     desc: "Browse verified tutors and book sessions instantly with one click." },
  { icon: Star,      title: "Rated Tutors",       desc: "Every tutor is rated after each session so you always get the best." },
  { icon: Shield,    title: "Credit System",      desc: "Pay only after your session completes. Credits transfer automatically." },
  { icon: BookOpen,  title: "Any Subject",        desc: "DSA, Maths, Physics, DBMS, OS, ML — find a tutor for anything." },
  { icon: TrendingUp,title: "Video Calls",        desc: "Built-in HD video calling, screen sharing, and chat — no third party." },
];

const STEPS = [
  { step: "01", title: "Create an account",     desc: "Sign up in 30 seconds. Free to join." },
  { step: "02", title: "Post or browse",        desc: "Post a learning request or find a tutor directly." },
  { step: "03", title: "Book & connect",        desc: "Schedule a session and join via video call or meet in person." },
  { step: "04", title: "Learn & rate",          desc: "Complete the session, transfer credits, leave a rating." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      {/* <nav className="h-16 border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 bg-white/80 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">LX</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">LearnXchange</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav> */}

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Real-time peer-to-peer learning
        </div>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
          Learn from peers,<br />
          <span className="text-blue-600">on your schedule</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Post a learning request, let tutors bid, or book directly.
          HD video calls, real-time chat, and a credit system built in.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            Start learning free <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition"
          >
            Become a tutor
          </Link>
        </div>

        {/* HERO STATS */}
        <div className="flex items-center justify-center gap-8 mt-14 pt-8 border-t border-gray-100">
          {[
            { value: "2 flows",   label: "Direct & Bidding"  },
            { value: "Real-time", label: "Video & Chat"       },
            { value: "Credit",    label: "Based payments"     },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-gray-900 text-lg">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to learn
            </h2>
            <p className="text-gray-500">Built for students who want to learn fast and tutors who want to earn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-100 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
          <p className="text-gray-500">From signup to your first session in minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
              <div className="text-3xl font-bold text-blue-100 leading-none shrink-0">{step}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Ready to start learning?
        </h2>
        <p className="text-blue-100 mb-8">
          Join LearnXchange — it's free to sign up.
        </p>
        <Link
          to="/login"
          className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3 rounded-xl transition inline-flex items-center gap-2 shadow-lg"
        >
          Get started now <ArrowRight size={16} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 LearnXchange. Built with ❤️ for learners.
      </footer>
    </div>
  );
}