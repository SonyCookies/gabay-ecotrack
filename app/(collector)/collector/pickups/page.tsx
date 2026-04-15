"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  RotateCw,
  List,
  Map as MapIcon,
  X,
  Activity,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Search,
  ChevronDown,
  Truck,
  Star,
  ArrowRight
} from "lucide-react";
import {
  PickupRequest,
  getRequestsByStatus,
  updatePickupStatus,
  WASTE_TYPE_LABELS
} from "@/lib/db/requests";
import { gabayToast } from "@/lib/toast";
import { Timestamp } from "firebase/firestore";
import PickupDataTable from "@/components/shared/PickupDataTable";

// Dynamically import the map to avoid SSR issues
const PickupRequestMap = dynamic(
  () => import("@/components/resident/PickupRequestMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] lg:h-[calc(100vh-200px)] bg-gray-50 animate-pulse rounded-2xl flex flex-col items-center justify-center border border-gray-100">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Loading Map View...</p>
      </div>
    )
  }
);

export default function CollectorPickupsPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<'scheduled' | 'collected'>('scheduled');
  const [filterType, setFilterType] = useState<PickupRequest['wasteType'] | 'all'>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.761541, 121.058226]);
  const [mapZoom, setMapZoom] = useState(14);

  const [inspectingRequest, setInspectingRequest] = useState<PickupRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [criteria, setCriteria] = useState({
    segregated: false,
    clean: false,
    packaged: false
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Collectors primarily deal with Scheduled (tasks) and Collected (history)
      const data = await getRequestsByStatus(["scheduled", "collected"]);
      setRequests(data);
    } catch (err) {
      gabayToast.error("Sync Failed", "Could not load pickups.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput);
  };

  const handleUpdateStatus = async (id: string, status: PickupRequest['status']) => {
    setIsSubmitting(true);

    // Calculate rating score from criteria
    const criteriaCount = Object.values(criteria).filter(Boolean).length;
    const score = criteriaCount === 3 ? 5 : criteriaCount === 2 ? 4 : criteriaCount === 1 ? 2 : 1;

    try {
      await updatePickupStatus(id, status, {
        rating: { score, criteria },
        updatedAt: new Date().toISOString()
      });
      gabayToast.success("Pickup Complete", `Rated ${score} ★ — marked as ${status}.`);
      setInspectingRequest(null);
      setShowRatingModal(false);
      setCriteria({ segregated: false, clean: false, packaged: false });
      fetchRequests();
    } catch (err) {
      gabayToast.error("Error", "Could not update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOnMap = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(18);
    setViewMode('map');
  };

  const filteredRequests = requests.filter(req => {
    const labelData = WASTE_TYPE_LABELS[req.wasteType];
    const friendlyType = `${labelData.label} ${labelData.sub}`.toLowerCase();
    
    const matchesSearch =
      req.residentName.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      req.id?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      friendlyType.includes(appliedSearch.toLowerCase());
    
    const matchesStatus = req.status === filterStatus;
    const matchesType = filterType === 'all' || req.wasteType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-700">
      {/* Brand Gradient Header */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Pickups
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Manage and verify collection tasks across your assigned route.</p>
            </div>
            <button 
              onClick={fetchRequests} 
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white active:scale-95 transition-all"
            >
              <RotateCw className={`w-5 h-5 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 flex-1">
              
              {/* Search Control */}
              <form onSubmit={handleSearch} className="relative group w-full lg:max-w-xs xl:max-w-md">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search resident or ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-12 pr-24 text-sm font-semibold focus:bg-white/20 focus:border-white/20 outline-none text-white transition-all shadow-sm placeholder:text-white/40"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                  <button type="submit" className="h-full px-5 bg-white text-brand-900 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg">
                    Search
                  </button>
                </div>
              </form>

              {/* Filter Tabs */}
              <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-2xl border border-white/5 w-full xl:w-auto">
                {(['scheduled', 'collected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      filterStatus === status ? 'bg-white text-brand-900 shadow-xl' : 'text-brand-100/60 hover:text-white'
                    }`}
                  >
                    {status === 'scheduled' ? 'Scheduled' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none lg:min-w-[180px]">
                    <button 
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className="flex items-center justify-between gap-3 bg-black/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95 shadow-lg w-full"
                    >
                      <span className="truncate">
                          {filterType === 'all' ? 'All Types' : WASTE_TYPE_LABELS[filterType].label}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTypeDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                        <div className="absolute top-full mt-2 left-0 right-0 lg:left-auto lg:right-0 lg:w-48 bg-brand-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                          {(['all', 'general', 'recyclable', 'bulk', 'biodegradable', 'hazardous'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                  setFilterType(type);
                                  setIsTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                                  filterType === type ? 'bg-white text-brand-900 shadow-lg' : 'text-brand-100 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span>{type === 'all' ? 'All Types' : WASTE_TYPE_LABELS[type].label}</span>
                              {filterType === type && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                </div>

                {/* Desktop View Toggles */}
                <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-2xl border border-white/5">
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-900 shadow-xl' : 'text-brand-100 hover:text-white'}`}>
                    <List className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('map')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white text-brand-900 shadow-xl' : 'text-brand-100 hover:text-white'}`}>
                    <MapIcon className="w-5 h-5" />
                    </button>
                </div>

            </div>
          </div>
        </div>

        {/* Main Interface Area */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/5 overflow-hidden flex flex-col min-h-[500px] h-[calc(100vh-270px)]">
          {loading && requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Pickups...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <>
              {viewMode === 'list' && (
                <PickupDataTable 
                  data={filteredRequests}
                  onViewOnMap={handleViewOnMap}
                  onUpdateStatus={(_id, _status) => {
                     // Find the request and open inspection drawer
                     const req = filteredRequests.find(r => r.id === _id);
                     if (req) setInspectingRequest(req);
                  }}
                  role="operator" // Use operator role for management buttons
                />
              )}

              {viewMode === 'map' && (
                <div className="flex-1 w-full relative">
                  <PickupRequestMap
                    onSelectLocation={() => { }}
                    selectedLocation={null}
                    activeRequests={filteredRequests}
                    center={mapCenter}
                    zoom={mapZoom}
                    onAccept={(id) => {
                       const req = filteredRequests.find(r => r.id === id);
                       if (req) setInspectingRequest(req);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                <Activity className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 tracking-tight italic">No pickups found</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                  Try a different search or wait for new jobs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${inspectingRequest ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setInspectingRequest(null)} />
        <div className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${inspectingRequest ? "translate-x-0" : "translate-x-full"}`}>
          <div className="bg-brand-900 p-8 text-white flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Truck className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase">Check Details</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-sm font-semibold opacity-80">{inspectingRequest?.residentName}</p>
                </div>
              </div>
              <button onClick={() => setInspectingRequest(null)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {inspectingRequest && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                
                {/* Visual Evidence */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-brand-600 px-1">Pickup Info</label>
                  {inspectingRequest.imageUrl ? (
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl">
                      <img src={inspectingRequest.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                      <p className="text-sm font-semibold">No photo</p>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Waste Type</p>
                    <p className="text-sm font-bold text-brand-900">
                      {WASTE_TYPE_LABELS[inspectingRequest.wasteType].label}
                    </p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Scheduled For</p>
                    <p className="text-sm font-bold text-gray-800">
                      {inspectingRequest.scheduledDate?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-brand-600 px-1">Notes</label>
                  <div className="p-6 bg-amber-50/30 rounded-[2.5rem] border border-amber-100/50">
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                      "{inspectingRequest.notes || "No notes."}"
                    </p>
                  </div>
                </div>

                {/* Extras Area */}
                {inspectingRequest.extras && inspectingRequest.extras.length > 0 && (
                  <div className="space-y-4">
                    {inspectingRequest.extras.map((extra, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-xs font-semibold border border-brand-100 mr-2 mb-2">
                        {extra}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-8 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                {inspectingRequest.status === 'scheduled' ? (
                  <button 
                    onClick={() => setShowRatingModal(true)}
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gray-900 text-white font-semibold text-sm rounded-[2rem] shadow-2xl shadow-brand-900/10 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Proceed to Rating <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full py-5 bg-gray-50 text-gray-400 font-semibold text-sm rounded-[2rem] border border-gray-100 flex items-center justify-center gap-3">
                    Already Collected <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waste Rating Modal */}
      {showRatingModal && inspectingRequest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            {/* Modal Header */}
            <div className="bg-brand-900 p-8 text-white relative">
              <h3 className="text-2xl font-bold tracking-tight">Rate Disposal</h3>
              <p className="text-sm font-medium text-brand-200/60 mt-1">Audit the appropriateness of the waste.</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-gray-400">Verification Criteria</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const count = Object.values(criteria).filter(Boolean).length;
                      const score = count === 3 ? 5 : count === 2 ? 4 : count === 1 ? 2 : 1;
                      return (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { id: 'segregated', label: 'Properly Segregated', desc: 'No mixed waste types detected.' },
                    { id: 'clean', label: 'Clean & Dry', desc: 'Free from residue and excess moisture.' },
                    { id: 'packaged', label: 'Securely Packaged', desc: 'Tied bags and no visible leaks.' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCriteria(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof criteria] }))}
                      className={`flex items-center text-left p-5 rounded-2xl border transition-all ${
                        criteria[item.id as keyof typeof criteria]
                          ? "bg-brand-50 border-brand-200 shadow-sm"
                          : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex-1 text-xs">
                        <p className={`font-bold ${criteria[item.id as keyof typeof criteria] ? 'text-brand-900' : 'text-gray-700'}`}>
                          {item.label}
                        </p>
                        <p className="font-semibold text-gray-500">{item.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        criteria[item.id as keyof typeof criteria] ? "bg-brand-600 border-brand-600" : "border-gray-100"
                      }`}>
                        {criteria[item.id as keyof typeof criteria] && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-3">
              <button
                onClick={() => { setShowRatingModal(false); setCriteria({ segregated: false, clean: false, packaged: false }); }}
                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => handleUpdateStatus(inspectingRequest.id!, 'collected')}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
