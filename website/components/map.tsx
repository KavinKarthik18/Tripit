"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Participant, MeetingPoint, Route, Location, ParticipantRole } from '@/types/trip';

// Custom icons for different marker types
const createCustomIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Create icons for different participant types
const bikeIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: '<div style="font-size: 24px;">🚲</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const meetingPointIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: '<div style="font-size: 24px; background-color: rgba(255, 255, 0, 0.5); padding: 4px; border-radius: 50%;">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface MapProps {
  activeTrip: Trip | null;
  userLocation: Location | null;
  destination: Location | null;
  selectedBikers: Participant[];
}

// Component to handle map updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Map({ activeTrip, userLocation, destination, selectedBikers }: MapProps) {
  // Chennai coordinates as default
  const defaultCenter: [number, number] = [13.0827, 80.2707];
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState(12);
  const mapRef = useRef<L.Map | null>(null);

  // Fix Leaflet icon issues
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Update map center based on active trip, destination, or user location
  useEffect(() => {
    if (activeTrip?.destination.location) {
      setCenter([
        activeTrip.destination.location.lat,
        activeTrip.destination.location.lng
      ]);
      setZoom(12);
    } else if (destination) {
      setCenter([destination.lat, destination.lng]);
      setZoom(13);
    } else if (userLocation) {
      setCenter([userLocation.lat, userLocation.lng]);
      setZoom(13);
    } else {
      setCenter(defaultCenter);
      setZoom(12);
    }
  }, [activeTrip, destination, userLocation]);

  // Get the appropriate icon based on participant role and status
  const getParticipantIcon = (participant: Participant) => {
    return bikeIcon;
  };

  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      ref={mapRef}
    >
      <MapUpdater center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Show user location */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={bikeIcon}>
          <Popup>
            <div className="font-medium">Your Location</div>
            <div className="text-sm text-muted-foreground">🚲 You are here</div>
          </Popup>
        </Marker>
      )}

      {/* Show destination */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={createCustomIcon('orange')}>
          <Popup>
            <div className="font-medium">Destination</div>
            <div className="text-sm text-muted-foreground">📍 Trip destination</div>
          </Popup>
        </Marker>
      )}

      {/* Show selected bikers */}
      {selectedBikers.map((biker) => (
        <Marker
          key={biker.id}
          position={[biker.location.lat, biker.location.lng]}
          icon={bikeIcon}
        >
          <Popup>
            <div>
              <div className="font-medium">{biker.name}</div>
              <div className="text-sm text-muted-foreground">{biker.role}</div>
              <div className="text-xs text-muted-foreground">Selected for trip</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Show active trip participants */}
      {activeTrip?.participants.map((participant) => (
        <Marker
          key={participant.id}
          position={[
            participant.currentLocation?.lat || participant.location.lat,
            participant.currentLocation?.lng || participant.location.lng
          ]}
          icon={bikeIcon}
        >
          <Popup>
            <div>
              <div className="font-medium">{participant.name}</div>
              <div className="text-sm text-muted-foreground">{participant.role}</div>
              <div className="text-xs text-muted-foreground">
                {participant.status || (participant.reachedDestination ? 'At Destination' :
                 participant.reachedMeetingPoint ? 'At Meeting Point' : 'En Route')}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Show meeting points */}
      {activeTrip?.meetingPoints?.map((point, index) => (
        <Marker
          key={index}
          position={[point.location.lat, point.location.lng]}
          icon={meetingPointIcon}
        >
          <Popup>
            <div>
              <div className="font-medium">Meeting Point {index + 1}</div>
              <div className="text-sm text-muted-foreground">
                Meeting for: {point.participants.map(p => p.name).join(', ')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Coordinates: {point.location.lat.toFixed(4)}, {point.location.lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Show routes */}
      {activeTrip?.routes?.map((route, index) => (
        <Polyline
          key={index}
          positions={route.coordinates}
          color={route.color}
          weight={3}
          opacity={0.8}
        >
          <Popup>
            <div>
              <div className="font-medium">{route.name}</div>
              <div className="text-sm text-muted-foreground">
                Distance: {route.distance.toFixed(2)} km
              </div>
              <div className="text-sm text-muted-foreground">
                Duration: {route.duration.toFixed(0)} min
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}
    </LeafletMapContainer>
  );
}