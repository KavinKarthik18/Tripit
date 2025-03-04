"use client";
import { useState } from "react";
import Map, { Marker } from "react-map-gl";

const MAPBOX_TOKEN = "YOUR_MAPBOX_ACCESS_TOKEN"; // Replace with your Mapbox token

export default function MapComponent({ friends }) {
  const [viewport, setViewport] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 13,
  });

  return (
    <Map
      initialViewState={viewport}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      className="w-full h-full"
    >
      {friends.map((friend, index) => (
        <Marker key={index} longitude={friend.lng} latitude={friend.lat}>
          🏍️
        </Marker>
      ))}
    </Map>
  );
}
