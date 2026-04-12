import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBidStore } from "../store/bidStore";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import { useRequestStore } from "../store/requestStore";
import toast from "react-hot-toast";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { bids, fetchBids, placeBid, acceptBid } = useBidStore();
  const { socket, connect } = useSocketStore();
  const { requests, fetchRequests } = useRequestStore();

  const [credits, setCredits] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState({});
  const [accepting, setAccepting] = useState(null);
  const [thisRequest, setThisRequest] = useState(null);

  useEffect(() => {
    connect();
    fetchBids(id);
    // fetch this specific request directly
    fetchThisRequest();
  }, [id]);

  const fetchThisRequest = async () => {
    try {
      // get from already loaded requests or refetch
      const { requests: reqs } = useRequestStore.getState();
      const found = reqs.find((r) => r._id === id);
      if (found) {
        setThisRequest(found);
      } else {
        await fetchRequests();
        const { requests: reqs2 } = useRequestStore.getState();
        setThisRequest(reqs2.find((r) => r._id === id));
      }
    } catch (e) {
      console.log(e);
    }
  };

  // ✅ isOwner — handle both populated object and raw string
  const isOwner = thisRequest
    ? (thisRequest.studentId?._id ?? thisRequest.studentId)?.toString() === user?._id?.toString()
    : false;

  // Real-time socket
  useEffect(() => {
    if (!socket) return;

    socket.emit("joinRequest", id);

    // ✅ Append bid directly — no refetch needed
    socket.on("newBid", (bid) => {
      useBidStore.setState((s) => ({
        bids: [bid, ...s.bids],
      }));
      toast("💰 New bid!", { icon: "🔔" });
    });

    return () => socket.off("newBid");
  }, [socket, id]);

  // Update thisRequest when requests store updates
  useEffect(() => {
    const found = requests.find((r) => r._id === id);
    if (found) setThisRequest(found);
  }, [requests, id]);

  const handleBid = async () => {
    if (!credits) return toast.error("Enter credits");
    if (isOwner) return toast.error("Can't bid on your own request");
    await placeBid({ requestId: id, credits: Number(credits), message });
    setCredits("");
    setMessage("");
    toast.success("Bid placed! 🔥");
  };

  const handleSchedule = async (bidId) => {
    const data = schedule[bidId];
    if (!data?.date || !data?.time) return toast.error("Pick date and time");
    if (!data?.mode) return toast.error("Pick online or offline");

    setAccepting(bidId);
    try {
      await acceptBid(bidId, {
        date: data.date,
        time: data.time,
        mode: data.mode,
      });
      toast.success("Appointment sent to tutor! ⏳");
      navigate("/appointments");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">

      {/* REQUEST HEADER */}
      {thisRequest && (
        <div className="bg-white rounded-xl border p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{thisRequest.subject}</h1>
              <p className="text-gray-500 mt-1">{thisRequest.topic}</p>
              {thisRequest.description && (
                <p className="text-sm text-gray-400 mt-1">{thisRequest.description}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">
                {thisRequest.maxCredits} credits
              </span>
              <div className="mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  thisRequest.urgency === "high"   ? "bg-red-100 text-red-600" :
                  thisRequest.urgency === "medium" ? "bg-yellow-100 text-yellow-600" :
                                                     "bg-green-100 text-green-600"
                }`}>
                  {thisRequest.urgency} urgency
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              thisRequest.status === "open"
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}>
              {thisRequest.status === "open" ? "🟢 Open for bids" : "🔴 Closed"}
            </span>
            <span className="text-xs text-gray-400">
              {bids.length} bid{bids.length !== 1 ? "s" : ""} so far
            </span>
          </div>

          {/* DEBUG — remove after confirming */}
          <p className="text-xs text-gray-300 mt-2">
            You: {user?._id} | Owner: {thisRequest.studentId?._id ?? thisRequest.studentId} | isOwner: {isOwner ? "YES" : "NO"}
          </p>
        </div>
      )}

      {/* PLACE BID — tutors only */}
      {!isOwner && thisRequest?.status === "open" && (
        <div className="bg-white rounded-xl border p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Place Your Bid</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              type="number"
              placeholder="Credits you want"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              placeholder="Why should they pick you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleBid}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
            >
              Bid 💰
            </button>
          </div>
        </div>
      )}

      {/* BIDS LIST */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">
          {isOwner ? "Bids on your request" : "All Bids"}
        </h2>

        {bids.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm">No bids yet. Be the first!</p>
          </div>
        )}

        <div className="space-y-4">
          {bids.map((bid) => (
            <div
              key={bid._id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition ${
                bid.status === "accepted" ? "border-green-400 bg-green-50" :
                bid.status === "rejected" ? "opacity-40" :
                "hover:shadow-md"
              }`}
            >
              {/* BID HEADER */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {bid.teacherId?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {bid.teacherId?.username}
                    </p>
                    <p className="text-xs text-gray-400">Tutor</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {bid.credits} credits
                  </p>
                  {bid.status !== "pending" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      bid.status === "accepted"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                    }`}>
                      {bid.status}
                    </span>
                  )}
                </div>
              </div>

              {/* MESSAGE */}
              {bid.message && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">
                  "{bid.message}"
                </p>
              )}

              {/* SCHEDULE — only owner, only pending */}
              {isOwner && bid.status === "pending" && thisRequest?.status === "open" && (
                <div className="mt-4 pt-4 border-t border-dashed">
                  <p className="text-xs text-gray-500 mb-3 font-medium">
                    📅 Accept this bid — pick a time:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="date"
                      onChange={(e) =>
                        setSchedule((p) => ({
                          ...p,
                          [bid._id]: { ...p[bid._id], date: e.target.value },
                        }))
                      }
                      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="time"
                      onChange={(e) =>
                        setSchedule((p) => ({
                          ...p,
                          [bid._id]: { ...p[bid._id], time: e.target.value },
                        }))
                      }
                      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <select
                      defaultValue=""
                      onChange={(e) =>
                        setSchedule((p) => ({
                          ...p,
                          [bid._id]: { ...p[bid._id], mode: e.target.value },
                        }))
                      }
                      className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="" disabled>Mode</option>
                      <option value="online">🟢 Online</option>
                      <option value="offline">🟡 Offline</option>
                    </select>
                    <button
                      onClick={() => handleSchedule(bid._id)}
                      disabled={accepting === bid._id}
                      className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition"
                    >
                      {accepting === bid._id ? "Sending..." : "Accept & Schedule ✅"}
                    </button>
                  </div>
                </div>
              )}

              {/* Tutor sees their own bid */}
              {!isOwner &&
                (bid.teacherId?._id ?? bid.teacherId)?.toString() === user?._id?.toString() && (
                <p className="mt-2 text-xs text-blue-500 font-medium">← Your bid</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}