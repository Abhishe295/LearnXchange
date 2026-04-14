import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBidStore } from "../store/bidStore";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import { useRequestStore } from "../store/requestStore";
import { Gavel, Send, Calendar, Clock, Wifi, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";

export default function RequestDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { bids, fetchBids, placeBid, acceptBid } = useBidStore();
  const { socket, connect }                       = useSocketStore();
  const { requests, fetchRequests }               = useRequestStore();

  const [credits, setCredits]     = useState("");
  const [message, setMessage]     = useState("");
  const [schedule, setSchedule]   = useState({});
  const [accepting, setAccepting] = useState(null);
  const [thisRequest, setThisRequest] = useState(null);

  useEffect(() => {
    connect();
    fetchBids(id);
    const reqs = useRequestStore.getState().requests;
    const found = reqs.find((r) => r._id === id);
    if (found) setThisRequest(found);
    else fetchRequests().then(() => {
      const r = useRequestStore.getState().requests.find((r) => r._id === id);
      if (r) setThisRequest(r);
    });
  }, [id]);

  useEffect(() => {
    const found = requests.find((r) => r._id === id);
    if (found) setThisRequest(found);
  }, [requests, id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("joinRequest", id);
    socket.on("newBid", (bid) => {
      useBidStore.setState((s) => ({ bids: [bid, ...s.bids] }));
      toast("New bid received!", { icon: "💰" });
    });
    return () => socket.off("newBid");
  }, [socket, id]);

  const isOwner = thisRequest
    ? (thisRequest.studentId?._id ?? thisRequest.studentId)?.toString() === user?._id?.toString()
    : false;

  const handleBid = async () => {
    if (!credits) return toast.error("Enter credits");
    if (isOwner)  return toast.error("Can't bid on your own request");
    await placeBid({ requestId: id, credits: Number(credits), message });
    setCredits(""); setMessage("");
    toast.success("Bid placed!");
  };

  const handleSchedule = async (bidId) => {
    const data = schedule[bidId];
    if (!data?.date || !data?.time) return toast.error("Pick date and time");
    if (!data?.mode)                 return toast.error("Pick a mode");
    setAccepting(bidId);
    try {
      await acceptBid(bidId, { date: data.date, time: data.time, mode: data.mode });
      toast.success("Appointment sent to tutor!");
      navigate("/appointments");
    } catch { toast.error("Something went wrong"); }
    finally { setAccepting(null); }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* REQUEST HEADER */}
      {thisRequest && (
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{thisRequest.subject}</h1>
              <p className="text-gray-500 mt-1 text-sm">{thisRequest.topic}</p>
              {thisRequest.description && (
                <p className="text-sm text-gray-400 mt-1">{thisRequest.description}</p>
              )}
            </div>
            <span className="text-xl font-bold text-blue-600 shrink-0 ml-4">
              {thisRequest.maxCredits} cr
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={thisRequest.status === "open" ? "green" : "gray"}>
              {thisRequest.status === "open" ? "Open for bids" : "Closed"}
            </Badge>
            <Badge variant={thisRequest.urgency === "high" ? "red" : thisRequest.urgency === "medium" ? "yellow" : "green"}>
              {thisRequest.urgency} urgency
            </Badge>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Gavel size={11} /> {bids.length} bid{bids.length !== 1 ? "s" : ""}
            </span>
          </div>
        </Card>
      )}

      {/* PLACE BID */}
      {!isOwner && thisRequest?.status === "open" && (
        <Card className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Gavel size={16} className="text-blue-500" /> Place Your Bid
          </h2>
          <div className="flex gap-2 flex-wrap">
            <input
              type="number" placeholder="Credits"
              value={credits} onChange={(e) => setCredits(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Why pick you?"
              value={message} onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleBid}>
              <Send size={14} /> Bid
            </Button>
          </div>
        </Card>
      )}

      {/* BIDS */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">
          {isOwner ? "Bids on your request" : "All Bids"}
        </h2>

        {bids.length === 0 ? (
          <EmptyState icon={Trophy} title="No bids yet" subtitle="Be the first to bid!" />
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => {
              const isMyBid = (bid.teacherId?._id ?? bid.teacherId)?.toString() === user?._id?.toString();
              return (
                <Card key={bid._id} className={
                  bid.status === "accepted" ? "!border-green-200 !bg-green-50/30" :
                  bid.status === "rejected" ? "opacity-40" : ""
                }>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={bid.teacherId?.username} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{bid.teacherId?.username}</p>
                        <p className="text-xs text-gray-400">Tutor {isMyBid && "· Your bid"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bid.status !== "pending" && (
                        <Badge variant={bid.status === "accepted" ? "green" : "red"}>{bid.status}</Badge>
                      )}
                      <span className="text-lg font-bold text-blue-600">{bid.credits} cr</span>
                    </div>
                  </div>

                  {bid.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic mb-3">
                      "{bid.message}"
                    </p>
                  )}

                  {isOwner && bid.status === "pending" && thisRequest?.status === "open" && (
                    <div className="pt-3 border-t border-dashed border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
                        <Calendar size={11} /> Accept this bid — pick a time
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <input type="date"
                          onChange={(e) => setSchedule((p) => ({ ...p, [bid._id]: { ...p[bid._id], date: e.target.value } }))}
                          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input type="time"
                          onChange={(e) => setSchedule((p) => ({ ...p, [bid._id]: { ...p[bid._id], time: e.target.value } }))}
                          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select defaultValue=""
                          onChange={(e) => setSchedule((p) => ({ ...p, [bid._id]: { ...p[bid._id], mode: e.target.value } }))}
                          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>Mode</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                        <Button
                          size="sm"
                          variant="primary"
                          loading={accepting === bid._id}
                          onClick={() => handleSchedule(bid._id)}
                        >
                          Accept & Schedule
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}