"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CollectionPoint, getCollectionPoints } from '@/lib/db/points';
import { MapPin, Truck } from 'lucide-react';

// Help helper for programmatic map movement
function ChangeView({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    map.flyTo(center, zoom || map.getZoom(), {
      animate: true,
      duration: 1.5
    });
  }, [center, zoom, map]);
  return null;
}

interface MapProps {
  onSelectLocation: (lat: number, lng: number) => void;
  selectedLocation: { lat: number, lng: number } | null;
  activeRequests?: any[];
  center?: [number, number];
  zoom?: number;
  onAccept?: (id: string) => void;
}

function MapEvents({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PickupRequestMap({ onSelectLocation, selectedLocation, activeRequests = [], center = [13.761541, 121.058226], zoom = 15, onAccept }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [officialPoints, setOfficialPoints] = useState<CollectionPoint[]>([]);

  // Memoize icons to prevent re-creation and SSR issues
  const icons = useMemo(() => {
    if (typeof window === 'undefined') return null;

    return {
      CollectionPoint: L.divIcon({
        html: `
          <div style="
            background-color: white; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            border: 1.5px solid #388e3c;
            overflow: hidden;
          ">
            <img src="/logo/gabaylogo.png" style="width: 24px; height: 24px; object-fit: contain;" />
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      }),
      RequestPin: L.divIcon({
        html: `
          <div style="
            background-color: #2563eb; 
            width: 36px; 
            height: 36px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
            border: 3px solid white;
            color: white;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      }),
      PendingPin: L.divIcon({
        html: `
          <div style="
            background-color: #f59e0b; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
            border: 2px solid white;
            color: white;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
      ScheduledPin: L.divIcon({
        html: `
          <div style="
            background-color: #10b981; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
            border: 2px solid white;
            color: white;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      }),
      CollectedPin: L.divIcon({
        html: `
          <div style="
            background-color: #64748b; 
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            border: 2px solid white;
            color: white;
            opacity: 0.8;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        `,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      })
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchOfficialPoints();
  }, []);

  const fetchOfficialPoints = async () => {
    try {
      const points = await getCollectionPoints();
      setOfficialPoints(points);
    } catch (err) {
      console.error("Failed to load official points:", err);
    }
  };

  const isValidCoord = (lat: any, lng: any) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  };

  if (!mounted || !icons) return (
    <div className="w-full h-[600px] lg:h-[calc(100vh-200px)] bg-gray-100 animate-pulse flex items-center justify-center rounded-2xl border border-gray-100 shadow-inner">
      <p className="text-sm font-semibold text-gray-400 italic">Initializing geospatial engine...</p>
    </div>
  );

  return (
    <MapContainer 
      id="gabay-resident-map"
      center={center} 
      zoom={zoom} 
      className="w-full h-[600px] lg:h-[calc(100vh-200px)] rounded-2xl shadow-2xl z-10 overflow-hidden"
      zoomControl={false}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%' }} 
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} zoom={zoom} />
      <MapEvents onSelectLocation={onSelectLocation} />
      
      {/* Official Collection Points */}
      {officialPoints
        .filter(p => isValidCoord(p.lat, p.lng))
        .map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]} icon={icons.CollectionPoint}>
          <Popup>
            <div className="p-2 min-w-[120px]">
              <p className="text-sm font-semibold text-emerald-600 mb-1">Official Site</p>
              <h4 className="text-sm font-semibold text-gray-900 leading-none">{point.name}</h4>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Active Selection */}
      {selectedLocation && isValidCoord(selectedLocation.lat, selectedLocation.lng) && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icons.RequestPin}>
          <Popup>
            <div className="p-2 min-w-[120px]">
              <p className="text-sm font-semibold text-blue-600 mb-1">Your Selection</p>
              <h4 className="text-sm font-semibold text-gray-900 leading-none">Tap "Confirm" to send</h4>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Requests Mapping */}
      {activeRequests
        .filter(req => (req.status === 'pending' || req.status === 'scheduled' || req.status === 'collected') && isValidCoord(req.lat, req.lng))
        .map((req) => (
          <Marker 
            key={req.id} 
            position={[req.lat, req.lng]} 
            icon={
              req.status === 'collected' ? icons.CollectedPin :
              req.status === 'scheduled' ? icons.ScheduledPin : icons.PendingPin
            }
            eventHandlers={{
                click: () => {
                    if (onAccept && req.status !== 'collected') onAccept(req.id);
                }
            }}
          />
        ))}
    </MapContainer>
  );
}
