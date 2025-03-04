"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Plus, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Fix the Leaflet icon issue
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
};

// Custom bike icon
const createBikeIcon = (color: string) => {
  return L.divIcon({
    html: `<div style="font-size: 24px; color: ${color};">🚲</div>`,
    className: "bike-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Friend type definition
interface Friend {
  id: string;
  name: string;
  avatar: string;
  location: [number, number];
  color: string;
  online: boolean;
}

// Hardcoded friends data
const initialFriends: Friend[] = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    location: [51.505, -0.09],
    color: "#FF5733",
    online: true,
  },
  {
    id: "2",
    name: "Sam Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    location: [51.51, -0.1],
    color: "#33FF57",
    online: false,
  },
  {
    id: "3",
    name: "Taylor Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    location: [51.515, -0.09],
    color: "#3357FF",
    online: true,
  },
];

// Component to recenter map
function SetViewOnClick({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

export default function BikeMap() {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [activeFriends, setActiveFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [center, setCenter] = useState<[number, number]>([51.505, -0.09]);
  const [isMuted, setIsMuted] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callLink, setCallLink] = useState("");
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const micRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fixLeafletIcon();
    
    // Simulate friends moving around
    const interval = setInterval(() => {
      setFriends(prevFriends => 
        prevFriends.map(friend => ({
          ...friend,
          location: [
            friend.location[0] + (Math.random() - 0.5) * 0.001,
            friend.location[1] + (Math.random() - 0.5) * 0.001
          ]
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddFriend = (friend: Friend) => {
    if (activeFriends.some(f => f.id === friend.id)) {
      setActiveFriends(activeFriends.filter(f => f.id !== friend.id));
    } else {
      setActiveFriends([...activeFriends, friend]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search for a location and update the map
    toast({
      title: "Searching for destination",
      description: `Looking for: ${searchQuery}`,
    });
    // Simulate finding a location
    const newLocation: [number, number] = [
      center[0] + (Math.random() - 0.5) * 0.01,
      center[1] + (Math.random() - 0.5) * 0.01
    ];
    setCenter(newLocation);
  };

  const toggleMute = async () => {
    if (isMuted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micRef.current = stream;
        setIsMuted(false);
        toast({
          title: "Microphone activated",
          description: "You can now speak with your friends",
        });
      } catch (err) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice chat",
          variant: "destructive",
        });
      }
    } else {
      if (micRef.current) {
        micRef.current.getTracks().forEach(track => track.stop());
        micRef.current = null;
      }
      setIsMuted(true);
      toast({
        title: "Microphone muted",
        description: "Your friends can no longer hear you",
      });
    }
  };

  const startCall = () => {
    if (activeFriends.length === 0) {
      toast({
        title: "No friends selected",
        description: "Please add friends to start a call",
        variant: "destructive",
      });
      return;
    }
    
    // Generate a unique link for the call
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const link = `https://bike-tracker.example/call/${uniqueId}`;
    setCallLink(link);
    setIsCallActive(true);
    
    toast({
      title: "Call started",
      description: "Call link has been generated and shared with your friends",
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallLink("");
    
    // Also mute the microphone when ending the call
    if (!isMuted) {
      if (micRef.current) {
        micRef.current.getTracks().forEach(track => track.stop());
        micRef.current = null;
      }
      setIsMuted(true);
    }
    
    toast({
      title: "Call ended",
      description: "You've disconnected from the call",
    });
  };

  return (
    <div className="relative h-screen w-full">
      <Toaster />
      
      {/* Map Container */}
      <div className="h-full w-full">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Show active friends on the map */}
          {activeFriends.map((friend) => (
            <Marker 
              key={friend.id} 
              position={friend.location}
              icon={createBikeIcon(friend.color)}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {friend.online ? "Online" : "Offline"}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          <SetViewOnClick coords={center} />
        </MapContainer>
      </div>
      
      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a destination..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          
          <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Friends</DialogTitle>
                <DialogDescription>
                  Select friends to track on the map
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={friend.avatar} alt={friend.name} />
                      <AvatarFallback style={{ backgroundColor: friend.color }}>
                        {friend.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {friend.online ? "Online" : "Offline"}
                      </p>
                    </div>
                    <Button
                      variant={activeFriends.some(f => f.id === friend.id) ? "default" : "outline"}
                      onClick={() => handleAddFriend(friend)}
                    >
                      {activeFriends.some(f => f.id === friend.id) ? "Remove" : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsAddFriendOpen(false)}>
                  Close
                </Button>
                {activeFriends.length > 0 && !isCallActive && (
                  <Button onClick={startCall}>
                    <Phone className="h-4 w-4 mr-2" />
                    Start Call
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {isCallActive && (
            <>
              <Button
                variant={isMuted ? "outline" : "default"}
                size="icon"
                onClick={toggleMute}
                className="relative"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Active Friends Display */}
      {activeFriends.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Card className="w-64">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Active Friends</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid gap-2">
                {activeFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: friend.color }}
                    />
                    <span className="text-sm">{friend.name}</span>
                    <Badge 
                      variant={friend.online ? "default" : "outline"}
                      className="ml-auto text-xs"
                    >
                      {friend.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            {callLink && (
              <CardFooter className="pt-0">
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-1">Call Link:</p>
                  <p className="text-xs bg-muted p-2 rounded overflow-hidden text-ellipsis">
                    {callLink}
                  </p>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}