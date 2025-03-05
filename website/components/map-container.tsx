"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Trip, Location, Participant } from '@/types/trip';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-[400px] w-full" />
        <div className="mt-4 text-muted-foreground">Loading map...</div>
      </div>
    </div>
  ),
});

interface MapContainerProps {
  activeTrip: Trip | null;
  userLocation: Location | null;
  destination: Location | null;
  selectedBikers: Participant[];
}

export function MapContainer({ activeTrip, userLocation, destination, selectedBikers }: MapContainerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-[400px] w-full" />
          <div className="mt-4 text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Map 
        activeTrip={activeTrip}
        userLocation={userLocation}
        destination={destination}
        selectedBikers={selectedBikers}
      />
    </div>
  );
}