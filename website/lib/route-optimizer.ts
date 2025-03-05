import { Trip, Participant, MeetingPoint, Route, Location, ParticipantRole } from '@/types/trip';

// Helper function to calculate distance between two points using Haversine formula
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to get route coordinates using OSRM (OpenStreetMap Routing Machine)
async function getRouteCoordinates(from: Location, to: Location): Promise<[number, number][]> {
  try {
    // Using OSRM demo server - in production, you should use your own OSRM instance
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }
    
    const data = await response.json();
    if (data.code !== 'Ok') {
      throw new Error('Route not found');
    }
    
    // Convert GeoJSON coordinates to [lat, lng] format
    return data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback to straight line if routing fails
    return generateFallbackPath(from, to);
  }
}

// Fallback function to generate a path if routing service fails
function generateFallbackPath(from: Location, to: Location): [number, number][] {
  const path: [number, number][] = [];
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = from.lat + (to.lat - from.lat) * ratio;
    const lng = from.lng + (to.lng - from.lng) * ratio;
    path.push([lat, lng]);
  }
  
  return path;
}

// Function to find optimal meeting points and generate routes
export async function calculateOptimalMeetingPoints(trip: Trip): Promise<{ 
  meetingPoints: MeetingPoint[], 
  routes: Route[],
  phase: 'meeting' | 'destination'
}> {
  const { participants, destination } = trip;
  const meetingPoints: MeetingPoint[] = [];
  const routes: Route[] = [];
  const colors = ['#3388ff', '#ff6b6b', '#33a02c', '#ff9900', '#9370db'];
  
  // Step 1: Find the optimal meeting point for all participants
  // We'll use the participant with the longest distance to destination as the reference
  let maxDistance = 0;
  let referenceParticipant = participants[0];
  
  for (const participant of participants) {
    const distance = calculateDistance(participant.location, destination.location);
    if (distance > maxDistance) {
      maxDistance = distance;
      referenceParticipant = participant;
    }
  }
  
  // Calculate the centroid of all participants
  const centroid: Location = {
    lat: participants.reduce((sum, p) => sum + p.location.lat, 0) / participants.length,
    lng: participants.reduce((sum, p) => sum + p.location.lng, 0) / participants.length
  };
  
  // Get road route from centroid to destination
  const centroidToDestination = await getRouteCoordinates(centroid, destination.location);
  
  // Find a meeting point along the route that minimizes total travel time
  let bestMeetingPoint = centroid;
  let minTotalTime = Infinity;
  
  // Try different points along the route
  const numPoints = 10;
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const pointIndex = Math.floor(ratio * (centroidToDestination.length - 1));
    const candidatePoint: Location = {
      lat: centroidToDestination[pointIndex][0],
      lng: centroidToDestination[pointIndex][1]
    };
    
    // Calculate total travel time for all participants to this point
    let totalTime = 0;
    let validPoint = true;
    
    for (const participant of participants) {
      try {
        const routeToMeeting = await getRouteCoordinates(participant.location, candidatePoint);
        const distanceToMeeting = calculateDistance(participant.location, candidatePoint);
        const timeToMeeting = distanceToMeeting * 3; // Rough estimate: 3 min per km
        
        const routeFromMeeting = await getRouteCoordinates(candidatePoint, destination.location);
        const distanceFromMeeting = calculateDistance(candidatePoint, destination.location);
        const timeFromMeeting = distanceFromMeeting * 3;
        
        totalTime += timeToMeeting + timeFromMeeting;
      } catch (error) {
        validPoint = false;
        break;
      }
    }
    
    if (validPoint && totalTime < minTotalTime) {
      minTotalTime = totalTime;
      bestMeetingPoint = candidatePoint;
    }
  }
  
  // Create a single meeting point for all participants
  const meetingPoint: MeetingPoint = {
    name: "Optimal Meeting Point",
    location: bestMeetingPoint,
    participants: participants
  };
  
  meetingPoints.push(meetingPoint);
  
  // Generate routes for each participant to the meeting point
  for (const participant of participants) {
    const coordinatesToMeeting = await getRouteCoordinates(participant.location, bestMeetingPoint);
    const distanceToMeeting = calculateDistance(participant.location, bestMeetingPoint);
    
    routes.push({
      name: `${participant.name} to Meeting Point`,
      from: participant.location,
      to: bestMeetingPoint,
      coordinates: coordinatesToMeeting,
      distance: distanceToMeeting,
      duration: distanceToMeeting * 3,
      color: colors[0],
      phase: 'meeting'
    });
  }
  
  // Generate route from meeting point to destination
  const coordinatesToDestination = await getRouteCoordinates(bestMeetingPoint, destination.location);
  const distanceToDestination = calculateDistance(bestMeetingPoint, destination.location);
  
  routes.push({
    name: "Meeting Point to Destination",
    from: bestMeetingPoint,
    to: destination.location,
    coordinates: coordinatesToDestination,
    distance: distanceToDestination,
    duration: distanceToDestination * 3,
    color: colors[1],
    phase: 'destination'
  });
  
  return { 
    meetingPoints, 
    routes,
    phase: 'meeting' // Initial phase is always 'meeting'
  };
}