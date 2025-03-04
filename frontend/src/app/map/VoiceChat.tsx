"use client";
import { useEffect, useState } from "react";
import { Peer } from "peerjs";

export default function VoiceChat({ callLink }) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      console.log("My Peer ID:", id);
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  const toggleMute = async () => {
    setIsMuted(!isMuted);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getAudioTracks()[0].enabled = !isMuted;
  };

  return (
    <div className="fixed bottom-16 right-4 bg-gray-800 text-white p-2 rounded">
      <p>Call: {callLink}</p>
      <button onClick={toggleMute} className="mt-2 p-2 bg-red-500 rounded">
        {isMuted ? "🔇 Unmute" : "🎤 Mute"}
      </button>
    </div>
  );
}