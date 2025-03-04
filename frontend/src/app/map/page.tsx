import { useState } from "react";
import MapComponent from "./MapComponent";
import VoiceChat from "./VoiceChat";

export default function MapPage() {
  const [callLink, setCallLink] = useState<string | null>(null);
  const [friends, setFriends] = useState([
    { name: "Alice", lat: 37.7749, lng: -122.4194 },
    { name: "Bob", lat: 37.78, lng: -122.42 },
  ]);

  const generateCallLink = async () => {
    const res = await fetch("/api/call");
    const data = await res.json();
    setCallLink(data.callLink);
  };

  return (
    <div className="flex flex-col h-screen">
      <MapComponent friends={friends} />
      <div className="fixed bottom-4 left-4 right-4 flex gap-3">
        <input
          type="text"
          placeholder="Search destination..."
          className="flex-1 p-2 border rounded"
        />
        <button onClick={() => setFriends([...friends, { name: "Charlie", lat: 37.79, lng: -122.41 }])}>
          ➕
        </button>
        <button onClick={generateCallLink} className="p-2 border rounded bg-blue-500 text-white">
          📞 Start Call
        </button>
      </div>
      {callLink && <VoiceChat callLink={callLink} />}
    </div>
  );
}