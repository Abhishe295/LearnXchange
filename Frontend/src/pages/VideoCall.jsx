import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocketStore } from "../store/socketStore";
import {
  Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, PhoneOff,
  Wifi, WifiOff, Users
} from "lucide-react";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export default function VideoCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connect, emit } = useSocketStore();

  const localRef       = useRef(null);
  const remoteRef      = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);
  const isCaller       = useRef(false);
  const pendingIce     = useRef([]);
  const handlingOffer  = useRef(false);
  const joined         = useRef(false);

  const [status,        setStatus]        = useState("Starting...");
  const [connected,     setConnected]     = useState(false);
  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteJoined,  setRemoteJoined]  = useState(false);

  const createPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) emit("webrtc:ice", { sessionId: id, candidate });
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[ICE]", pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log("[PC]", pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnected(true);
        setStatus("Connected ✅");
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setConnected(false);
        setRemoteJoined(false);
        setStatus("Disconnected");
      }
    };

    pc.ontrack = (event) => {
      console.log("[TRACK]", event.track.kind, event.streams.length);
      const stream = event.streams[0];
      if (!stream) return;
      if (remoteRef.current && remoteRef.current.srcObject !== stream) {
        remoteRef.current.srcObject = stream;
      }
      setRemoteJoined(true);
      setConnected(true);
      setStatus("Connected ✅");
    };

    pcRef.current = pc;
    return pc;
  }, [id, emit]);

  const initStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = createPeer();
      stream.getTracks().forEach((track) => {
        console.log("[LOCAL] Adding track:", track.kind);
        pc.addTrack(track, stream);
      });

      return pc;
    } catch (err) {
      console.error("[STREAM]", err);
      toast.error("Camera/mic access denied");
      setStatus("Camera access denied ❌");
      return null;
    }
  }, [createPeer]);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription?.type) return;
    console.log(`[ICE] Flushing ${pendingIce.current.length} candidates`);
    for (const c of pendingIce.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.log("[ICE] flush error:", e);
      }
    }
    pendingIce.current = [];
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // ── Connect socket on mount ──────────────────────────────
  useEffect(() => {
    connect();
  }, []);

  // ── Main WebRTC effect ───────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    if (joined.current) return;

    const setupListeners = () => {
      if (joined.current) return;
      joined.current = true;

      console.log("[SOCKET] Joining session", id);
      socket.emit("joinSession", id);

      socket.on("webrtc:role", async ({ role }) => {
        console.log("[ROLE]", role);
        isCaller.current = role === "caller";
        await initStream();
        setStatus(role === "caller" ? "Waiting for other person..." : "Waiting for call...");
      });

      socket.on("webrtc:ready", async () => {
        if (!isCaller.current) return;
        const pc = pcRef.current;
        if (!pc) return;
        console.log("[READY] Creating offer...");
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          console.log("[OFFER] Sent");
          emit("webrtc:offer", { sessionId: id, offer });
          setStatus("Connecting...");
        } catch (err) {
          console.error("[OFFER] Error:", err);
        }
      });

      socket.on("webrtc:offer", async (offer) => {
        console.log("[OFFER] Received");
        if (isCaller.current) return;
        if (handlingOffer.current) return;
        handlingOffer.current = true;

        try {
          let pc = pcRef.current;
          if (!pc) {
            pc = await initStream();
            if (!pc) return;
          }
          if (pc.signalingState !== "stable") {
            console.warn("[OFFER] Bad state:", pc.signalingState);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("[ANSWER] Sent");
          emit("webrtc:answer", { sessionId: id, answer });
        } catch (err) {
          console.error("[OFFER] Handle error:", err);
        } finally {
          handlingOffer.current = false;
        }
      });

      socket.on("webrtc:answer", async (answer) => {
        if (!isCaller.current) return;
        const pc = pcRef.current;
        if (!pc) return;
        if (pc.signalingState !== "have-local-offer") {
          console.warn("[ANSWER] Wrong state:", pc.signalingState);
          return;
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingIce();
          console.log("[ANSWER] Remote desc set ✅");
        } catch (err) {
          console.error("[ANSWER] Error:", err);
        }
      });

      socket.on("webrtc:ice", async (candidate) => {
        const pc = pcRef.current;
        if (!pc) return;
        if (pc.remoteDescription?.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.log("[ICE] Add error:", e);
          }
        } else {
          pendingIce.current.push(candidate);
        }
      });

      socket.on("webrtc:peerLeft", () => {
        setRemoteJoined(false);
        setConnected(false);
        setStatus("Other person left");
        toast("Other person left the call", { icon: "📵" });
        if (remoteRef.current) remoteRef.current.srcObject = null;
      });
    };

    // ✅ Key fix: if socket exists but isn't connected yet, wait for it
    if (socket.connected) {
      setupListeners();
    } else {
      socket.once("connect", setupListeners);
    }

    return () => {
      socket.off("connect", setupListeners);
      socket.off("webrtc:role");
      socket.off("webrtc:ready");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice");
      socket.off("webrtc:peerLeft");
    };
  }, [socket]);

  useEffect(() => () => cleanup(), [cleanup]);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const toggleScreenShare = async () => {
    try {
      if (screenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const vTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(vTrack);
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        setScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const vTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(vTrack);
        if (localRef.current) localRef.current.srcObject = stream;
        setScreenSharing(true);
        vTrack.onended = () => toggleScreenShare();
      }
    } catch (err) {
      toast.error("Screen share failed");
    }
  };

  const handleLeave = () => {
    emit("webrtc:leave", { sessionId: id });
    cleanup();
    navigate(`/session/${id}`);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col select-none">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
          <span className="text-white text-sm font-semibold">LearnXchange Video</span>
        </div>
        <div className="flex items-center gap-2">
          {connected
            ? <Wifi size={14} className="text-green-400" />
            : <WifiOff size={14} className="text-yellow-400" />}
          <span className="text-gray-400 text-xs">{status}</span>
        </div>
        <button onClick={handleLeave}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <PhoneOff size={14} /> Leave
        </button>
      </div>

      {/* VIDEO AREA */}
      <div className="flex-1 relative overflow-hidden bg-gray-900 p-3">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800 relative flex items-center justify-center">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${!remoteJoined ? "hidden" : ""}`}
          />
          {!remoteJoined && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                <Users size={40} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium">{status}</p>
              <p className="text-xs text-gray-600 mt-1">Both people need to open this page</p>
            </div>
          )}
          {remoteJoined && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-lg">
              Other Person
            </div>
          )}
        </div>

        {/* LOCAL PiP */}
        <div className="absolute bottom-6 right-6 w-52 aspect-video rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-800 shadow-2xl">
          <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff size={28} className="text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded">
            You{screenSharing ? " · Screen" : ""}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-5 bg-gray-800 border-t border-gray-700">
        <button onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} text-white`}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} text-white`}>
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${screenSharing ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"} text-white`}>
          {screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button onClick={handleLeave}
          className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition">
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}