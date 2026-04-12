import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, connect, emit } = useSocketStore();

  const localRef       = useRef(null);
  const remoteRef      = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);
  const isCaller       = useRef(false);

  const [status, setStatus]               = useState("Starting camera...");
  const [micOn, setMicOn]                 = useState(true);
  const [camOn, setCamOn]                 = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteJoined, setRemoteJoined]   = useState(false);

  // ── Create peer connection ──────────────────────────────
  const createPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        emit("webrtc:ice", { sessionId: id, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteRef.current && e.streams[0]) {
        remoteRef.current.srcObject = e.streams[0];
        setRemoteJoined(true);
        setStatus("Connected ✅");
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "disconnected" || state === "failed") {
        setRemoteJoined(false);
        setStatus("Other person disconnected");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [id, emit]);

  // ── Init local stream + add tracks to peer ──────────────
  const initStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = createPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      return pc;
    } catch (err) {
      console.error(err);
      toast.error("Could not access camera/mic");
      setStatus("Camera access denied ❌");
      return null;
    }
  }, [createPeer]);

  // ── Cleanup ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // ── Connect socket on mount ──────────────────────────────
  useEffect(() => {
    connect();
  }, []);

  // ── Main WebRTC logic once socket is ready ───────────────
  useEffect(() => {
    if (!socket) return;

    // Tell server we joined this session room
    socket.emit("joinSession", id);

    // Server assigns caller/answerer role
    socket.on("webrtc:role", async ({ role }) => {
      isCaller.current = role === "caller";
      setStatus(role === "caller"
        ? "Waiting for other person..."
        : "Connecting..."
      );

      const pc = await initStream();
      if (!pc) return;

      if (role === "caller") {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          emit("webrtc:offer", { sessionId: id, offer });
        } catch (err) {
          console.error("Offer error:", err);
        }
      }
    });

    // Answerer receives offer
    socket.on("webrtc:offer", async (offer) => {
      if (isCaller.current) return; // caller ignores offers

      try {
        // If no peer yet (edge case), init stream
        if (!pcRef.current) {
          await initStream();
        }

        const pc = pcRef.current;
        if (pc.signalingState !== "stable") return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit("webrtc:answer", { sessionId: id, answer });
        setStatus("Connected ✅");
        setRemoteJoined(true);
      } catch (err) {
        console.error("Answer error:", err);
      }
    });

    // Caller receives answer
    socket.on("webrtc:answer", async (answer) => {
      if (!isCaller.current) return; // only caller handles answer

      try {
        const pc = pcRef.current;
        if (!pc) return;

        // ✅ Guard against wrong state — this was causing the error
        if (pc.signalingState !== "have-local-offer") {
          console.warn("Ignoring answer — not in have-local-offer state:", pc.signalingState);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus("Connected ✅");
        setRemoteJoined(true);
      } catch (err) {
        console.error("setRemoteDescription error:", err);
      }
    });

    // ICE candidates
    socket.on("webrtc:ice", async (candidate) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        // Only add ICE after remote description is set
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.log("ICE error:", err);
      }
    });

    // Other person left
    socket.on("webrtc:peerLeft", () => {
      setRemoteJoined(false);
      setStatus("Other person ended the call");
      toast("Other person left the call", { icon: "📵" });
      if (remoteRef.current) remoteRef.current.srcObject = null;
    });

    return () => {
      socket.off("webrtc:role");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice");
      socket.off("webrtc:peerLeft");
    };
  }, [socket, id, emit, initStream]);

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ── Controls ─────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (screenSharing) {
        // Switch back to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, audio: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(videoTrack);
        localStreamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        setScreenSharing(false);
      } else {
        // Switch to screen
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(videoTrack);
        if (localRef.current) localRef.current.srcObject = stream;
        setScreenSharing(true);

        // Auto revert when user stops from browser UI
        videoTrack.onended = () => toggleScreenShare();
      }
    } catch (err) {
      toast.error("Screen share failed");
      console.error(err);
    }
  };

  const handleLeave = () => {
    emit("webrtc:leave", { sessionId: id });
    cleanup();
    navigate(`/session/${id}`);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-900 flex flex-col">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-sm font-medium">
            LearnXchange Video
          </span>
        </div>
        <span className="text-gray-400 text-xs font-medium">{status}</span>
        <button
          onClick={handleLeave}
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ✕ Leave
        </button>
      </div>

      {/* VIDEO AREA */}
      <div className="flex-1 relative bg-gray-900 p-4 overflow-hidden">

        {/* REMOTE — full background */}
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteJoined && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-5xl mb-4">
                👤
              </div>
              <p className="text-sm">{status}</p>
              {status === "Waiting for other person..." && (
                <p className="text-xs text-gray-500 mt-1">
                  Share the session link with them
                </p>
              )}
            </div>
          )}
          {remoteJoined && (
            <div className="absolute bottom-6 left-6 bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-lg">
              Other Person
            </div>
          )}
        </div>

        {/* LOCAL — picture in picture */}
        <div className="absolute bottom-6 right-6 w-48 aspect-video rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-800 shadow-2xl">
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-4xl">
              😶
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-0.5 rounded">
            You {screenSharing ? "· Screen" : ""}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-center gap-4 py-5 bg-gray-800 border-t border-gray-700">

        {/* MIC */}
        <button
          onClick={toggleMic}
          title={micOn ? "Mute mic" : "Unmute mic"}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${
            micOn
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {micOn ? "🎙️" : "🔇"}
        </button>

        {/* CAM */}
        <button
          onClick={toggleCam}
          title={camOn ? "Turn off camera" : "Turn on camera"}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${
            camOn
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {camOn ? "📹" : "🚫"}
        </button>

        {/* SCREEN SHARE */}
        <button
          onClick={toggleScreenShare}
          title={screenSharing ? "Stop sharing" : "Share screen"}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${
            screenSharing
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          🖥️
        </button>

        {/* END CALL */}
        <button
          onClick={handleLeave}
          title="End call"
          className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-2xl transition"
        >
          📵
        </button>
      </div>
    </div>
  );
}