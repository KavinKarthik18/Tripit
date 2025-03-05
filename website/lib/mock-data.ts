import { Participant, ParticipantRole } from '@/types/trip';

export const mockBikers: Participant[] = [
  {
    id: '1',
    name: 'John Doe',
    location: { lat: 13.0827, lng: 80.2707 }, // Chennai
    role: ParticipantRole.LEADER,
    status: 'friend'
  },
  {
    id: '2',
    name: 'Alice Smith',
    location: { lat: 13.0827 + 0.01, lng: 80.2707 + 0.01 },
    role: ParticipantRole.MEMBER,
    status: 'friend'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    location: { lat: 13.0827 - 0.01, lng: 80.2707 - 0.01 },
    role: ParticipantRole.MEMBER,
    status: 'available'
  },
  {
    id: '4',
    name: 'Charlie Brown',
    location: { lat: 13.0827 + 0.02, lng: 80.2707 + 0.02 },
    role: ParticipantRole.MEMBER,
    status: 'available'
  },
  {
    id: '5',
    name: 'David Wilson',
    location: { lat: 13.0827 - 0.02, lng: 80.2707 - 0.02 },
    role: ParticipantRole.TRAILER,
    status: 'friend'
  },
  {
    id: '6',
    name: 'Eve Anderson',
    location: { lat: 13.0827 + 0.03, lng: 80.2707 + 0.03 },
    role: ParticipantRole.MEMBER,
    status: 'available'
  },
  {
    id: '7',
    name: 'Frank Miller',
    location: { lat: 13.0827 - 0.03, lng: 80.2707 - 0.03 },
    role: ParticipantRole.MEMBER,
    status: 'friend'
  },
  {
    id: '8',
    name: 'Grace Lee',
    location: { lat: 13.0827 + 0.04, lng: 80.2707 + 0.04 },
    role: ParticipantRole.MEMBER,
    status: 'available'
  }
]; 