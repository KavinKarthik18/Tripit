"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer } from '@/components/map-container';
import { TripForm } from '@/components/trip-form';
import { MapPin, Users, Navigation, Play, Pause, RotateCcw, Search } from 'lucide-react';
import { Trip, ParticipantRole, Route, Location, Participant } from '@/types/trip';
import { TripSimulator } from '@/components/trip-simulator';
import { calculateOptimalMeetingPoints } from '@/lib/route-optimizer';
import { mockBikers } from '@/lib/mock-data';
import { DestinationSearch } from '@/components/destination-search';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LandingPage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [showBikerSelection, setShowBikerSelection] = useState(false);
  const [selectedBikers, setSelectedBikers] = useState<Participant[]>([]);
  const [destination, setDestination] = useState<Location | null>(null);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const { toast } = useToast();

  // Get user's location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enable location services.",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  const handleBikerSelect = (biker: Participant) => {
    setSelectedBikers(prev => {
      const isSelected = prev.some(b => b.id === biker.id);
      if (isSelected) {
        return prev.filter(b => b.id !== biker.id);
      } else {
        return [...prev, { ...biker, status: 'selected' }];
      }
    });
  };

  const handleBikerSelectionConfirm = () => {
    if (selectedBikers.length === 0) {
      toast({
        title: "No Bikers Selected",
        description: "Please select at least one biker to join your trip.",
        variant: "destructive"
      });
      return;
    }
    setShowBikerSelection(false);
    setShowDestinationSearch(true);
  };

  const handleDestinationSelect = async (location: Location) => {
    setDestination(location);
    setShowDestinationSearch(false);

    setIsCalculatingRoutes(true);
    try {
      // Create the trip object first
      const trip: Trip = {
        id: Math.random().toString(36).substr(2, 9),
        name: "New Trip",
        destination: {
          name: "Selected Destination",
          location: location
        },
        participants: selectedBikers,
        createdAt: new Date(),
        isSimulating: false,
        simulationStep: 0
      };

      // Set the active trip immediately with initial state
      setActiveTrip(trip);

      // Calculate routes in the background
      const { meetingPoints, routes, phase } = await calculateOptimalMeetingPoints(trip);
      
      // Update the trip with calculated routes
      setActiveTrip(prev => prev ? {
        ...prev,
        meetingPoints,
        routes,
        phase,
        isSimulating: false,
        simulationStep: 0
      } : null);
    } catch (error) {
      console.error('Error calculating routes:', error);
      toast({
        title: "Error",
        description: "Failed to calculate optimal routes. Please try again.",
        variant: "destructive"
      });
      // Reset the active trip if there was an error
      setActiveTrip(null);
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  const handleStartSimulation = () => {
    if (activeTrip) {
      setIsSimulating(true);
      setActiveTrip({
        ...activeTrip,
        isSimulating: true,
        simulationStep: 0
      });
    }
  };

  const handlePauseSimulation = () => {
    if (activeTrip) {
      setIsSimulating(false);
      setActiveTrip({
        ...activeTrip,
        isSimulating: false
      });
    }
  };

  const handleResetSimulation = () => {
    if (activeTrip) {
      setIsSimulating(false);
      const resetParticipants = activeTrip.participants.map(p => ({
        ...p,
        currentLocation: { ...p.location },
        reachedMeetingPoint: false,
        reachedDestination: false
      }));
      
      setActiveTrip({
        ...activeTrip,
        participants: resetParticipants,
        isSimulating: false,
        simulationStep: 0,
        phase: 'meeting'
      });
    }
  };

  const handleSimulationUpdate = (updatedTrip: Trip) => {
    const allReachedMeetingPoints = updatedTrip.participants.every(p => p.reachedMeetingPoint);
    
    if (allReachedMeetingPoints && updatedTrip.phase === 'meeting') {
      setShowStartConfirmation(true);
      setIsSimulating(false);
      setActiveTrip({
        ...updatedTrip,
        isSimulating: false
      });
    } else {
      setActiveTrip(updatedTrip);
    }
  };

  const handleStartConfirmation = () => {
    if (activeTrip) {
      setShowStartConfirmation(false);
      setIsSimulating(true);
      setActiveTrip({
        ...activeTrip,
        isSimulating: true,
        phase: 'destination'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MeetPoint</h1>
          </div>
          {!showTripForm && !activeTrip && (
            <Button onClick={() => setShowTripForm(true)}>Create Trip</Button>
          )}
          {activeTrip && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{activeTrip.name}</span>
              <Button variant="outline" size="sm" onClick={() => setActiveTrip(null)}>End Trip</Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-6 grid gap-6 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px]">
        <div className="h-[calc(100vh-10rem)] rounded-lg overflow-hidden border">
          <MapContainer 
            activeTrip={activeTrip} 
            userLocation={userLocation}
            destination={destination}
            selectedBikers={selectedBikers}
          />
          {activeTrip && isSimulating && (
            <TripSimulator 
              trip={activeTrip} 
              onUpdate={handleSimulationUpdate} 
            />
          )}
        </div>

        <div className="space-y-6">
          {!activeTrip && !showTripForm && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to MeetPoint</CardTitle>
                <CardDescription>
                  Plan your trips and find the optimal meeting points for you and your friends.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Optimal Meeting Points</h3>
                    <p className="text-sm text-muted-foreground">Find the best places to meet based on everyone's location</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Real-time Coordination</h3>
                    <p className="text-sm text-muted-foreground">Share locations and track everyone's progress</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Route Optimization</h3>
                    <p className="text-sm text-muted-foreground">Get the most efficient routes to your destination</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setShowTripForm(true)}>
                  Create Your First Trip
                </Button>
              </CardFooter>
            </Card>
          )}

          {showTripForm && !showDestinationSearch && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Your Trip</CardTitle>
                <CardDescription>
                  Select your friends to join the trip
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userLocation ? (
                  <div className="p-3 rounded-md bg-secondary">
                    <div className="font-medium">Your Location</div>
                    <div className="text-sm text-muted-foreground">
                      Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-secondary">
                    <div className="text-sm text-muted-foreground">
                      Waiting for your location...
                    </div>
                  </div>
                )}
                {!showBikerSelection ? (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowBikerSelection(true)}
                  >
                    <Users className="h-4 w-4 mr-2" /> Select Friends
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Available Friends</h3>
                      <div className="space-y-2">
                        {mockBikers.map((biker) => (
                          <div
                            key={biker.id}
                            className="flex items-center justify-between p-2 rounded-md bg-secondary"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                biker.status === 'friend' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              <span className="font-medium">{biker.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-background rounded-full">
                                {biker.role}
                              </span>
                            </div>
                            <Button
                              variant={selectedBikers.some(b => b.id === biker.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleBikerSelect(biker)}
                            >
                              {selectedBikers.some(b => b.id === biker.id) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedBikers.length > 0 && (
                      <div className="p-3 rounded-md bg-secondary">
                        <div className="font-medium">Selected Friends ({selectedBikers.length})</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {selectedBikers.map(b => b.name).join(', ')}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => setShowBikerSelection(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleBikerSelectionConfirm}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {showTripForm && showDestinationSearch && (
            <Card>
              <CardHeader>
                <CardTitle>Select Destination</CardTitle>
                <CardDescription>
                  Choose where you want to go with your friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DestinationSearch onDestinationSelect={handleDestinationSelect} />
              </CardContent>
            </Card>
          )}

          {activeTrip && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{activeTrip.name}</CardTitle>
                  <CardDescription>
                    Trip to {activeTrip.destination.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Participants ({activeTrip.participants.length})</h3>
                      <div className="space-y-2">
                        {activeTrip.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                participant.reachedDestination ? 'bg-green-500' : 
                                participant.reachedMeetingPoint ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              <span className="font-medium">{participant.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-background rounded-full">
                                {participant.role}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {participant.reachedDestination ? 'At Destination' : 
                               participant.reachedMeetingPoint ? 'At Meeting Point' : 'En Route'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Meeting Points</h3>
                      {isCalculatingRoutes ? (
                        <div className="p-3 rounded-md bg-secondary">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">Calculating optimal meeting points...</span>
                          </div>
                        </div>
                      ) : activeTrip.meetingPoints && activeTrip.meetingPoints.length > 0 ? (
                        <div className="space-y-2">
                          {activeTrip.meetingPoints.map((point, index) => (
                            <div key={index} className="p-3 rounded-md bg-secondary">
                              <div className="font-medium">{point.name || `Meeting Point ${index + 1}`}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Meeting for: {point.participants.map(p => p.name).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-md bg-secondary">
                          <div className="text-sm text-muted-foreground">
                            No meeting points needed
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {!isSimulating ? (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={handleStartSimulation}
                    >
                      <Play className="h-4 w-4 mr-2" /> Start Simulation
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={handlePauseSimulation}
                    >
                      <Pause className="h-4 w-4 mr-2" /> Pause Simulation
                    </Button>
                  )}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleResetSimulation}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset Simulation
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTrip(null)}>
                    End Trip
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Trip Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Destination</h3>
                      <p>{activeTrip.destination.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Roles</h3>
                      <div className="space-y-1 mt-1">
                        <p className="text-sm">
                          <span className="font-medium">Leader:</span> {activeTrip.participants.find(p => p.role === ParticipantRole.LEADER)?.name || 'None'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Trailer:</span> {activeTrip.participants.find(p => p.role === ParticipantRole.TRAILER)?.name || 'None'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Simulation Status</h3>
                      <p>{isSimulating ? 'Running' : 'Stopped'}</p>
                      {isSimulating && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Step: {activeTrip.simulationStep || 0}
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Current Phase</h3>
                      <p className="capitalize">{activeTrip.phase}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Estimated Total Distance</h3>
                      <p>{activeTrip.routes?.reduce((sum: number, route: Route) => sum + route.distance, 0).toFixed(1) || '0'} km</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Estimated Total Time</h3>
                      <p>{Math.round(activeTrip.routes?.reduce((sum: number, route: Route) => sum + route.duration, 0) || 0)} minutes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showStartConfirmation} onOpenChange={setShowStartConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Everyone at Meeting Point?</DialogTitle>
            <DialogDescription>
              All participants have reached the meeting point. Would you like to start the trip to the destination?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartConfirmation(false)}>
              Wait
            </Button>
            <Button onClick={handleStartConfirmation}>
              Start Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        With OpenStreetMap Routing Machine
      </div>
    </div>
  );
}