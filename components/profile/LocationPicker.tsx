"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin, Navigation } from "lucide-react";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-[1.5rem] border border-gray-100">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Initializing Map Matrix...</p>
    </div>
  ),
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAutoDetect: () => void;
}

export default function LocationPicker({ lat, lng, onLocationSelect, onAutoDetect }: LocationPickerProps) {
  return (
    <div className="flex flex-col h-full space-y-4 pt-4">
      <div className="flex items-center justify-between px-2">
        <button 
            type="button"
            onClick={onAutoDetect}
            className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-100 transition-all active:scale-95"
        >
            <Navigation className="w-3.5 h-3.5" />
            Auto Detect Location
        </button>
      </div>

      <div className="relative flex-1 w-full min-h-[400px] rounded-[1.8rem] border border-gray-100 shadow-xl shadow-brand-900/5 bg-white p-1">
        <MapComponent 
            center={{ lat, lng }} 
            zoom={lat === 12.8797 && lng === 121.7740 ? 6 : 15} 
            onLocationSelect={onLocationSelect} 
        />
        
        {/* Floating coordinate badge */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl px-4 py-3 shadow-2xl flex gap-6">
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Latitude</span>
                <span className="text-xs font-bold text-gray-900">{lat.toFixed(6)}</span>
            </div>
            <div className="flex flex-col border-l border-gray-100 pl-6">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Longitude</span>
                <span className="text-xs font-bold text-gray-900">{lng.toFixed(6)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
