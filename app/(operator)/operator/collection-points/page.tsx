"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  MapPin, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Search,
  CheckCircle2,
  RotateCw,
  Tag,
  Layers
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { gabayToast } from "@/lib/toast";
import { 
  getCollectionPoints, 
  addCollectionPoint, 
  deleteCollectionPoint, 
  CollectionPoint 
} from "@/lib/db/points";
import { WASTE_TYPE_LABELS } from "@/lib/db/requests";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

// Dynamically import the map to avoid SSR issues with Leaflet
const CollectionPointMap = dynamic(
  () => import("@/components/operator/CollectionPointMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-50 animate-pulse flex flex-col items-center justify-center rounded-2xl border border-gray-100">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Loading Map View...</p>
      </div>
    )
  }
);

export default function CollectionPointsPage() {
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newPointData, setNewPointData] = useState<{ lat: number, lng: number } | null>(null);
  const [pointName, setPointName] = useState("");
  const [pointType, setPointType] = useState<CollectionPoint['type']>('residential');
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const data = await getCollectionPoints();
      setPoints(data);
    } catch (err) {
      gabayToast.error("Error", "Could not synchronize collection points.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewPointData({ lat, lng });
    setIsAdding(true);
  };

  const handleCreatePoint = async () => {
    if (!pointName.trim() || !newPointData || !auth.currentUser) return;

    setLoading(true);
    try {
      await addCollectionPoint({
        name: pointName,
        type: pointType,
        lat: newPointData.lat,
        lng: newPointData.lng,
        active: true,
        operatorId: auth.currentUser.uid
      });
      
      gabayToast.success("Success", "Collection point added.");
      setPointName("");
      setIsAdding(false);
      setNewPointData(null);
      await fetchPoints();
    } catch (err) {
      gabayToast.error("Error", "Could not save collection point.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;

    try {
      await deleteCollectionPoint(isDeleting);
      gabayToast.success("Archived", "Collection point removed from the system.");
      await fetchPoints();
    } catch (err) {
      gabayToast.error("Error", "Could not delete collection point.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPoints = points.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-700">
      {/* Brand Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-white">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                Collection Points
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Define and manage designated waste collection nodes across the community.</p>
            </div>
            <button 
              onClick={fetchPoints} 
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white active:scale-95 transition-all"
            >
              <RotateCw className={`w-5 h-5 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Map Instruction Button */}
            <div className="flex bg-brand-600 p-1 rounded-2xl shadow-lg shadow-brand-900/10">
              <div className="flex items-center justify-center px-6 py-2.5 text-white font-semibold text-sm rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Click Map to Add Node
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Area: Map + Sidebar */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 pb-8">
          
          {/* Map Panel */}
          <div className="lg:col-span-3 h-[450px] lg:h-[calc(100vh-270px)] relative">
            <CollectionPointMap 
              points={points} 
              onAddPoint={handleMapClick} 
            />

            {/* Add Point Overlay */}
            {isAdding && newPointData && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-[350px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-in zoom-in-95 duration-300">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="absolute top-7 right-7 p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Location info</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Point details</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Location Name</label>
                       <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                              <Tag className="h-5 w-5" />
                          </div>
                           <input 
                            type="text" 
                            value={pointName}
                            onChange={(e) => setPointName(e.target.value)}
                            placeholder="e.g. Market Gate"
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Point Type</label>
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                              <Layers className="h-5 w-5" />
                          </div>
                          <select 
                            value={pointType}
                            onChange={(e) => setPointType(e.target.value as any)}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm appearance-none"
                          >
                            <option value="residential">Houses</option>
                            <option value="commercial">Market</option>
                            <option value="industrial">Workplace</option>
                            <option value="other">General</option>
                          </select>
                      </div>
                    </div>

                    <button
                      onClick={handleCreatePoint}
                      disabled={loading}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 mt-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Save location
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Node Directory Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-brand-900/5 flex flex-col overflow-hidden h-[500px] lg:h-[calc(100vh-270px)]">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight capitalize">Saved nodes</h3>
              <p className="text-sm font-semibold text-gray-400 capitalize mt-0.5">Pickup directory</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading && points.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                </div>
              ) : filteredPoints.length > 0 ? (
                filteredPoints.map((point) => (
                  <div key={point.id} className="p-5 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-brand-900/5 border border-transparent hover:border-brand-100 rounded-3xl transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-transparent flex items-center justify-center text-brand-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-brand-600 capitalize leading-none mb-1.5">{point.type}</p>
                          <h4 className="text-sm font-bold text-gray-900 leading-tight">{point.name}</h4>
                          <p className="text-xs font-semibold text-gray-400 mt-1">
                            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsDeleting(point.id!)}
                        className="p-2 text-gray-200 group-hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <MapPin className="w-10 h-10 mb-4" />
                  <p className="text-xs font-bold capitalize leading-none mb-2">No nodes found</p>
                  <p className="text-[10px] font-semibold">Click map to initialize point.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 capitalize">Active Nodes: {points.length}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Point?"
        message="This will permanently remove the pickup spot from the map. You cannot undo this."
      />

    </div>
  );
}
