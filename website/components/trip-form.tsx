"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trip, Participant, Location, ParticipantRole } from '@/types/trip';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Chennai coordinates as default
const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;

// Form schema
const formSchema = z.object({
  tripName: z.string().min(3, { message: "Trip name must be at least 3 characters" }),
  destinationName: z.string().min(3, { message: "Destination name is required" }),
  destinationLat: z.string().refine((val) => !isNaN(parseFloat(val)), { message: "Must be a valid latitude" }),
  destinationLng: z.string().refine((val) => !isNaN(parseFloat(val)), { message: "Must be a valid longitude" }),
});

type FormValues = z.infer<typeof formSchema>;

interface TripFormProps {
  onCreateTrip: (trip: Trip) => void;
  onCancel: () => void;
}

export function TripForm({ onCreateTrip, onCancel }: TripFormProps) {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: uuidv4(),
      name: "You",
      location: { lat: CHENNAI_LAT + 0.01, lng: CHENNAI_LNG + 0.01 },
      role: ParticipantRole.LEADER
    }
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tripName: "",
      destinationName: "",
      destinationLat: CHENNAI_LAT.toString(),
      destinationLng: CHENNAI_LNG.toString(),
    },
  });

  const addParticipant = () => {
    // Add a new participant with a random location near Chennai
    const randomLat = CHENNAI_LAT + (Math.random() * 0.05 - 0.025);
    const randomLng = CHENNAI_LNG + (Math.random() * 0.05 - 0.025);
    
    setParticipants([
      ...participants,
      {
        id: uuidv4(),
        name: `Friend ${participants.length}`,
        location: { lat: randomLat, lng: randomLng },
        role: ParticipantRole.MEMBER
      }
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one participant for the trip",
        variant: "destructive"
      });
      return;
    }
    
    setParticipants(participants.filter(p => p.id !== id));
  };

  const updateParticipantName = (id: string, name: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  const updateParticipantLocation = (id: string, field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setParticipants(participants.map(p => {
      if (p.id === id) {
        return {
          ...p,
          location: {
            ...p.location,
            [field]: numValue
          }
        };
      }
      return p;
    }));
  };

  const updateParticipantRole = (id: string, role: ParticipantRole) => {
    // If setting a new leader, remove leader role from others
    if (role === ParticipantRole.LEADER) {
      setParticipants(participants.map(p => ({
        ...p,
        role: p.id === id ? ParticipantRole.LEADER : 
              (p.role === ParticipantRole.LEADER ? ParticipantRole.MEMBER : p.role)
      })));
    } 
    // If setting a new trailer, remove trailer role from others
    else if (role === ParticipantRole.TRAILER) {
      setParticipants(participants.map(p => ({
        ...p,
        role: p.id === id ? ParticipantRole.TRAILER : 
              (p.role === ParticipantRole.TRAILER ? ParticipantRole.MEMBER : p.role)
      })));
    }
    // Otherwise just update the role
    else {
      setParticipants(participants.map(p => 
        p.id === id ? { ...p, role } : p
      ));
    }
  };

  const onSubmit = (values: FormValues) => {
    if (participants.length === 0) {
      toast({
        title: "No participants",
        description: "Please add at least one participant to the trip",
        variant: "destructive"
      });
      return;
    }

    // Ensure we have exactly one leader and one trailer
    const hasLeader = participants.some(p => p.role === ParticipantRole.LEADER);
    const hasTrailer = participants.some(p => p.role === ParticipantRole.TRAILER);

    if (!hasLeader) {
      toast({
        title: "No leader assigned",
        description: "Please assign a leader for the trip",
        variant: "destructive"
      });
      return;
    }

    if (!hasTrailer && participants.length > 1) {
      toast({
        title: "No trailer assigned",
        description: "Please assign a trailer for the trip",
        variant: "destructive"
      });
      return;
    }

    const newTrip: Trip = {
      id: uuidv4(),
      name: values.tripName,
      destination: {
        name: values.destinationName,
        location: {
          lat: parseFloat(values.destinationLat),
          lng: parseFloat(values.destinationLng)
        }
      },
      participants: participants.map(p => ({
        ...p,
        currentLocation: { ...p.location }, // Initialize current location with starting location
        reachedMeetingPoint: false,
        reachedDestination: false
      })),
      meetingPoints: [],
      createdAt: new Date(),
      isSimulating: false,
      simulationStep: 0
    };

    onCreateTrip(newTrip);
    
    toast({
      title: "Trip created",
      description: `Your trip "${values.tripName}" has been created successfully`
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Trip</CardTitle>
        <CardDescription>
          Fill in the details to plan your trip with friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tripName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekend Getaway" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your trip a memorable name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel>Destination</FormLabel>
                <FormDescription>
                  Enter the final destination for your trip
                </FormDescription>
              </div>

              <FormField
                control={form.control}
                name="destinationName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Marina Beach" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destinationLat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationLng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Participants</FormLabel>
                  <FormDescription>
                    Add friends joining this trip with their locations and roles
                  </FormDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="space-y-3 p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={participant.name}
                          onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                          placeholder={`Participant ${index + 1}`}
                        />
                      </div>
                      <Select 
                        value={participant.role} 
                        onValueChange={(value) => updateParticipantRole(participant.id, value as ParticipantRole)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ParticipantRole.LEADER}>Leader</SelectItem>
                          <SelectItem value={ParticipantRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={ParticipantRole.TRAILER}>Trailer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParticipant(participant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormLabel className="text-xs">Latitude</FormLabel>
                        <Input 
                          value={participant.location.lat}
                          onChange={(e) => updateParticipantLocation(participant.id, 'lat', e.target.value)}
                          placeholder="Latitude"
                          size={10}
                        />
                      </div>
                      <div>
                        <FormLabel className="text-xs">Longitude</FormLabel>
                        <Input 
                          value={participant.location.lng}
                          onChange={(e) => updateParticipantLocation(participant.id, 'lng', e.target.value)}
                          placeholder="Longitude"
                          size={10}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Create Trip</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}