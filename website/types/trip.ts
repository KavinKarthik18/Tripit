export interface Location {
  lat: number;
  lng: number;
}

export interface Participant {
  id: string;
  name: string;
  location: Location;
  role?: ParticipantRole;
  status?: 'friend' | 'available' | 'selected';
  currentLocation?: Location; // For simulation
  reachedMeetingPoint?: boolean;
  reachedDestination?: boolean;
}

export enum ParticipantRole {
  LEADER = "Leader",
  MEMBER = "Member",
  TRAILER = "Trailer"
}

export interface Destination {
  name: string;
  location: Location;
}

export interface MeetingPoint {
  name?: string;
  location: Location;
  participants: Participant[];
}

export interface Route {
  name: string;
  from: Location;
  to: Location;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  color: string;
  phase: 'meeting' | 'destination';
}

export interface Trip {
  id: string;
  name: string;
  destination: Destination;
  participants: Participant[];
  meetingPoints?: MeetingPoint[];
  routes?: Route[];
  phase?: 'meeting' | 'destination';
  createdAt: Date;
  isSimulating?: boolean;
  simulationStep?: number;
}