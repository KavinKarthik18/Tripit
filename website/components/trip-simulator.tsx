"use client";

import { useEffect, useRef, useState } from 'react';
import { Trip, Participant, Location, MeetingPoint, Route } from '@/types/trip';
import { calculateDistance } from '@/lib/route-optimizer';
import { Button } from '@/components/ui/button';

interface TripSimulatorProps {
  trip: Trip;
  onUpdate: (updatedTrip: Trip) => void;
}

export function TripSimulator({ trip, onUpdate }: TripSimulatorProps) {
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const BASE_SIMULATION_SPEED = 100; // Faster base speed
  const STEP_SIZE = 0.002; // Larger step size for more visible movement

  // Helper function to move a participant towards a target
  const moveTowardsTarget = (current: Location, target: Location, stepSize: number): Location => {
    const distance = calculateDistance(current, target);
    
    // If very close to target, snap to it
    if (distance < stepSize) {
      return { ...target };
    }
    
    // Calculate direction vector
    const dx = target.lng - current.lng;
    const dy = target.lat - current.lat;
    
    // Normalize direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    
    // Move in the direction of the target
    return {
      lat: current.lat + normalizedDy * stepSize,
      lng: current.lng + normalizedDx * stepSize
    };
  };

  // Function to update participant positions in a simulation step
  const updateParticipantPositions = (participants: Participant[], meetingPoints: MeetingPoint[] | undefined, destination: Location): Participant[] => {
    return participants.map(participant => {
      // If already at destination, don't move
      if (participant.reachedDestination) {
        return participant;
      }
      
      // Find the participant's meeting point if any
      const meetingPoint = meetingPoints?.find(mp => 
        mp.participants.some(p => p.id === participant.id)
      );
      
      // Find the participant's current route
      const currentRoute = trip.routes?.find(route => {
        if (trip.phase === 'meeting') {
          // In meeting phase, find route from participant's location to their meeting point
          return route.from.lat === participant.location.lat && 
                 route.from.lng === participant.location.lng &&
                 route.phase === 'meeting';
        } else {
          // In destination phase, find route from meeting point to destination
          return route.from.lat === meetingPoint?.location.lat && 
                 route.from.lng === meetingPoint?.location.lng &&
                 route.phase === 'destination';
        }
      });
      
      if (!currentRoute) {
        console.log('No route found for participant:', participant.name);
        return participant;
      }
      
      // Get current position
      const currentPos = participant.currentLocation || participant.location;
      
      // Find the next point along the route
      const coordinates = currentRoute.coordinates;
      let nextPoint: Location | null = null;
      
      // Find the closest point on the route
      let minDistance = Infinity;
      let closestIndex = 0;
      
      for (let i = 0; i < coordinates.length; i++) {
        const distance = calculateDistance(
          currentPos,
          { lat: coordinates[i][0], lng: coordinates[i][1] }
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      
      // Get the next point along the route
      if (closestIndex < coordinates.length - 1) {
        nextPoint = {
          lat: coordinates[closestIndex + 1][0],
          lng: coordinates[closestIndex + 1][1]
        };
      } else {
        nextPoint = {
          lat: coordinates[coordinates.length - 1][0],
          lng: coordinates[coordinates.length - 1][1]
        };
      }
      
      // Move towards the next point
      const newLocation = moveTowardsTarget(
        currentPos,
        nextPoint,
        STEP_SIZE * speedMultiplier
      );
      
      // Check if reached the target (meeting point or destination)
      const target = trip.phase === 'meeting' ? meetingPoint?.location : destination;
      const reachedTarget = target && calculateDistance(newLocation, target) < 0.0001;
      
      // Update participant state
      const updatedParticipant = {
        ...participant,
        currentLocation: newLocation,
        reachedMeetingPoint: trip.phase === 'meeting' ? reachedTarget : participant.reachedMeetingPoint,
        reachedDestination: trip.phase === 'destination' ? reachedTarget : participant.reachedDestination,
        status: reachedTarget ? 
          (trip.phase === 'meeting' ? 'at meeting point 🚲' : 'reached destination 🎯') :
          'moving 🚲'
      };

      // If we've reached the meeting point, update the current location to the meeting point
      if (trip.phase === 'meeting' && reachedTarget && meetingPoint) {
        updatedParticipant.currentLocation = meetingPoint.location;
      }

      return updatedParticipant;
    });
  };

  // Function to check if all participants have reached their current target
  const allParticipantsReachedTarget = (participants: Participant[], meetingPoints: MeetingPoint[] | undefined): boolean => {
    if (trip.phase === 'meeting') {
      // In meeting phase, check if all participants have reached their meeting points
      return participants.every(p => {
        const meetingPoint = meetingPoints?.find(mp => 
          mp.participants.some(mp => mp.id === p.id)
        );
        return !meetingPoint || p.reachedMeetingPoint;
      });
    } else {
      // In destination phase, check if all participants have reached the destination
      return participants.every(p => p.reachedDestination);
    }
  };

  // Run the simulation
  useEffect(() => {
    if (trip.isSimulating) {
      // Clear any existing interval
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      
      // Start a new simulation interval
      simulationInterval.current = setInterval(() => {
        // Update participant positions
        const updatedParticipants = updateParticipantPositions(
          trip.participants,
          trip.meetingPoints,
          trip.destination.location
        );
        
        // Check if all participants have reached their current target
        const allReached = allParticipantsReachedTarget(updatedParticipants, trip.meetingPoints);
        
        // Update the trip with new positions and increment step
        const updatedTrip = {
          ...trip,
          participants: updatedParticipants,
          simulationStep: (trip.simulationStep || 0) + 1
        };
        
        // If all participants have reached their target, handle phase transition
        if (allReached) {
          if (trip.phase === 'meeting') {
            // Transition to destination phase
            updatedTrip.phase = 'destination';
            // Update status for all participants
            updatedTrip.participants = updatedTrip.participants.map(p => ({
              ...p,
              status: 'moving to destination 🚲'
            }));
          } else {
            // End simulation when all participants reach destination
            updatedTrip.isSimulating = false;
            if (simulationInterval.current) {
              clearInterval(simulationInterval.current);
              simulationInterval.current = null;
            }
            // Update final status
            updatedTrip.participants = updatedTrip.participants.map(p => ({
              ...p,
              status: 'reached destination 🎯'
            }));
          }
        }
        
        // Notify parent component of the update
        onUpdate(updatedTrip);
      }, BASE_SIMULATION_SPEED / speedMultiplier);
    } else {
      // Stop simulation if isSimulating is false
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
    };
  }, [trip, onUpdate, speedMultiplier]);

  // Speed control buttons
  const speedOptions = [1, 2, 4, 8, 16, 32];

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
      {speedOptions.map((speed) => (
        <Button
          key={speed}
          variant={speedMultiplier === speed ? "default" : "outline"}
          size="sm"
          onClick={() => setSpeedMultiplier(speed)}
        >
          {speed}x
        </Button>
      ))}
    </div>
  );
}