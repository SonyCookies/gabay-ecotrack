"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CollectionPoint } from '@/lib/db/points';

// Fix for default marker icons in Leaflet with Next.js
// Custom GABAY Marker Icon ( Branded with white circular background )
const GabayIcon = L.divIcon({
  html: `
    <div style="
      background-color: white; 
      width: 44px; 
      height: 44px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 2px solid #388e3c;
      overflow: hidden;
    ">
      <img src="/logo/gabaylogo.png" style="width: 38px; height: 38px; object-fit: contain;" />
    </div>
  `,
  className: '', // Remove default leaflet class
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

L.Marker.prototype.options.icon = GabayIcon;

interface MapProps {
  points: CollectionPoint[];
  onAddPoint: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
}

function MapEvents({ onAddPoint }: { onAddPoint: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAddPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CollectionPointMap({ points, onAddPoint, center = [13.761541, 121.058226], zoom = 15 }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-[2rem]">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Initializing Map Engine...</p>
    </div>
  );

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className="w-full h-full rounded-2xl shadow-2xl z-10 border border-gray-100"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onAddPoint={onAddPoint} />
      
      {points.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]}>
          <Popup>
            <div className="p-2 min-w-[150px] font-sans">
              <p className="text-[11px] font-bold text-brand-600 capitalize leading-none mb-2">{point.type}</p>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">{point.name}</h4>
              <p className="text-[10px] font-semibold text-gray-400 mt-2">
                {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
