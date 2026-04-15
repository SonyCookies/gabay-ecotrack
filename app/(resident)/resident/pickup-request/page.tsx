"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Truck, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Navigation,
  FileText,
  Calendar,
  Search,
  Plus,
  ArrowRight,
  ImageIcon,
  MapPin,
  ExternalLink,
  RotateCw,
  List,
  Map as MapIcon,
  ChevronRight,
  X,
  History,
  Home
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { gabayToast } from "@/lib/toast";
import { 
  getMyRequests, 
  deletePickupRequest, 
  hasActiveRequest,
  PickupRequest,
  WASTE_TYPE_LABELS 
} from "@/lib/db/requests";
import { useAppSelector } from "@/lib/store/hooks";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import OrderPickupDrawer from "@/components/resident/OrderPickupDrawer";
import PickupDataTable from "@/components/shared/PickupDataTable";

// Dynamically import the map for Residents
const PickupRequestMap = dynamic(
  () => import("@/components/resident/PickupRequestMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-brand-50/30 animate-pulse flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-100">
        <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">Waking up Map...</p>
      </div>
    )
  }
);

export default function PickupRequestPage() {
  const { address } = useAppSelector(state => state.auth);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActive, setHasActive] = useState(false);
  
  // Design-aligned states
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<'pending' | 'scheduled' | 'collected'>('pending');
  const [filterType, setFilterType] = useState<PickupRequest['wasteType'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  // Selection State
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.761541, 121.058226]);
  const [mapZoom, setMapZoom] = useState(15);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const history = await getMyRequests(auth.currentUser.uid);
      setRequests(history);
      const active = await hasActiveRequest(auth.currentUser.uid);
      setHasActive(active);
    } catch (err) {
      gabayToast.error("Error", "Could not load pickup history.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setViewMode('list'); // Switch to list to see results better
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (hasActive) {
      gabayToast.warning("Active Dispatch", "You already have a pickup in progress.");
      return;
    }
    setSelectedLocation({ lat, lng });
    setIsDrawerOpen(true);
  };

  const handleRequestFromHome = () => {
    if (!address?.coordinates) return;
    handleLocationSelect(address.coordinates.lat, address.coordinates.lng);
  };

  const handleDeleteConfirm = async () => {
    if (!isCancelling) return;
    try {
      await deletePickupRequest(isCancelling);
      gabayToast.success("Dispatch Revoked", "Pickup order has been withdrawn.");
      await fetchHistory();
    } catch (err) {
      gabayToast.error("Error", "Could not withdraw order.");
    } finally {
      setIsCancelling(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = !appliedSearch || 
      req.id?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      req.notes.toLowerCase().includes(appliedSearch.toLowerCase());
    
    const matchesStatus = req.status === filterStatus;
    const matchesType = filterType === 'all' || req.wasteType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-700 pb-12">
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Cluster */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    Pickup Request
                </h1>
                <p className="text-brand-100/60 text-sm font-medium">Schedule and track your doorstep collection requests.</p>
            </div>
            <button onClick={fetchHistory} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white active:scale-95 transition-all">
              <RotateCw className={`w-5 h-5 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-white">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 flex-1">
              {/* Search Control */}
              <form onSubmit={handleSearch} className="relative group w-full lg:max-w-xs xl:max-w-md">
                <input
                  type="text"
                  placeholder="Search my history..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-4 pr-24 text-sm font-semibold focus:border-white/20 focus:ring-4 focus:ring-white/5 outline-none text-white transition-all shadow-sm placeholder:text-white/40"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                  <button type="submit" className="h-full px-5 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                    Search
                  </button>
                </div>
              </form>

              {/* Status Tabs */}
              <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/5 w-full xl:w-auto overflow-x-auto no-scrollbar">
                {['pending', 'scheduled', 'collected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                      filterStatus === status ? 'bg-white text-brand-900 shadow-lg' : 'text-brand-100 hover:text-white'
                    }`}
                  >
                    {status === 'collected' ? 'completed' : status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:min-w-[180px]">
                <button 
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="flex items-center justify-between gap-3 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 text-sm font-semibold capitalize text-white transition-all hover:bg-white/10 active:scale-95 shadow-lg w-full"
                >
                  <span className="truncate">
                    {filterType === 'all' ? 'All categories' : WASTE_TYPE_LABELS[filterType].label}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-90' : 'rotate-0 text-white/30'}`} />
                </button>

                {isTypeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                    <div className="absolute top-full mt-2 left-0 right-0 lg:right-auto lg:w-64 bg-brand-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                      {(['all', 'general', 'recyclable', 'bulk', 'biodegradable', 'hazardous'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFilterType(type);
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all flex items-center justify-between group ${
                            filterType === type ? 'bg-white text-brand-900 shadow-lg' : 'text-brand-100 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{type === 'all' ? 'All categories' : WASTE_TYPE_LABELS[type].label}</span>
                          {filterType === type && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-900 shadow-md' : 'text-brand-300 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-brand-900 shadow-md' : 'text-brand-300 hover:text-white'}`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Request from Home Button */}
              {address?.coordinates && (
                <button
                  onClick={handleRequestFromHome}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Home className="w-4 h-4" />
                  Request from Home
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Area */}
        {loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-brand-900/40">Synchronizing records...</p>
          </div>
        ) : (viewMode === 'map' || requests.length > 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-brand-900/5 overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-200px)]">
            {viewMode === 'list' && (
              <PickupDataTable 
                data={filteredRequests}
                onViewOnMap={(lat, lng) => {
                  setMapCenter([lat, lng]);
                  setMapZoom(18);
                  setViewMode('map');
                }}
                onWithdraw={setIsCancelling}
                role="resident"
                loading={loading}
              />
            )}

            {viewMode === 'map' && (
              <div className="flex-1 w-full relative">
                <div className="absolute top-8 left-8 z-20 pointer-events-none">
                  <div className="bg-white shadow-2xl border border-gray-100 px-5 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    <span className="text-sm font-semibold text-gray-900">Click map to set location</span>
                  </div>
                </div>
                <PickupRequestMap 
                  onSelectLocation={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  activeRequests={filteredRequests}
                  center={mapCenter}
                  zoom={mapZoom}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 h-[600px] flex flex-col items-center justify-center text-center shadow-sm p-10 sm:p-20">
            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-100 mb-8 border border-gray-100 shadow-inner">
              <Navigation className="w-12 h-12 rotate-45" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 italic">Welcome to Gabay</h3>
            <p className="text-sm font-semibold text-gray-400 max-w-sm mb-10 leading-relaxed">
              No previous dispatches detected. Switch to map view to set your location and launch your first pickup request.
            </p>
            <button 
              onClick={() => setViewMode('map')}
              className="px-10 py-4 bg-brand-900 border border-brand-800 text-white rounded-2xl text-sm font-semibold transition-all hover:bg-black active:scale-95 shadow-2xl shadow-brand-950/30 flex items-center gap-3"
            >
              <MapIcon className="w-4 h-4" />
              Open Live Map
            </button>
          </div>
        )}
      </div>

      <OrderPickupDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLocation(null);
        }}
        onSuccess={() => {
          fetchHistory();
          setViewMode('list');
          setFilterStatus('pending');
        }}
        location={selectedLocation}
      />

      <ConfirmationModal 
        isOpen={!!isCancelling}
        onClose={() => setIsCancelling(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke Dispatch Order?"
        message="This will permanently nullify your request at the operation center. Proceed?"
      />
    </div>
  );
}
