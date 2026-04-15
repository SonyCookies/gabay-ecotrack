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
  Star
} from "lucide-react";
import {
  PickupRequest,
  getAllActiveRequests,
  getRequestsByStatus,
  updatePickupStatus,
  bulkUpdatePickupStatus,
  WASTE_TYPE_LABELS
} from "@/lib/db/requests";
import { gabayToast } from "@/lib/toast";
import { Timestamp } from "firebase/firestore";
import PickupDataTable from "@/components/shared/PickupDataTable";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

const PickupRequestMap = dynamic(
  () => import("@/components/resident/PickupRequestMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] lg:h-[calc(100vh-200px)] bg-gray-50 animate-pulse rounded-xl flex flex-col items-center justify-center border border-gray-100">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-400">Loading map...</p>
      </div>
    )
  }
);

export default function OperatorPickupsPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<'pending' | 'scheduled' | 'collected'>('pending');
  const [filterType, setFilterType] = useState<PickupRequest['wasteType'] | 'all'>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.761541, 121.058226]);
  const [mapZoom, setMapZoom] = useState(14);

  const [schedulingRequest, setSchedulingRequest] = useState<PickupRequest | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Rating Audit State
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
      // Fetch core active requests + recent completed ones
      const data = await getRequestsByStatus(["pending", "scheduled", "collected"]);
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

  const handleUpdateStatus = async (id: string, status: PickupRequest['status'], options: { date?: string, rating?: any } = {}) => {
    try {
      const { date, rating } = options;
      let scheduledDate: Timestamp | undefined = undefined;

      if (status === 'scheduled') {
        if (!date) {
          const req = requests.find(r => r.id === id);
          if (req) {
            setSchedulingRequest(req);
            setCriteria({
              segregated: req.rating?.criteria ? req.rating.criteria.includes('segregated') : false,
              clean: req.rating?.criteria ? req.rating.criteria.includes('clean') : false,
              packaged: req.rating?.criteria ? req.rating.criteria.includes('packaged') : false
            });
          }
          return;
        }
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          gabayToast.error("Invalid Date", "Please enter a valid date.");
          return;
        }
        scheduledDate = Timestamp.fromDate(d);
      }

      await updatePickupStatus(id, status, { scheduledDate, rating });
      gabayToast.success("Saved", `Pickup is now ${status}.`);
      setSchedulingRequest(null);
      setCriteria({ segregated: false, clean: false, packaged: false });
      fetchRequests();
    } catch (err) {
      gabayToast.error("Error", "Could not save.");
    }
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingRequest?.id) return;
    setIsSubmittingSchedule(true);
    
    const targetStatus = schedulingRequest.status === 'pending' ? 'scheduled' : 'collected';
    
    let rating = undefined;
    if (targetStatus === 'collected') {
      const criteriaCount = Object.values(criteria).filter(Boolean).length;
      const score = criteriaCount === 3 ? 5 : criteriaCount === 2 ? 4 : criteriaCount === 1 ? 2 : 1;
      rating = { score, criteria: Object.keys(criteria).filter(k => criteria[k as keyof typeof criteria]) };
    }

    await handleUpdateStatus(schedulingRequest.id, targetStatus, { date: selectedDate, rating });
    setIsSubmittingSchedule(false);
  };

  const handleBulkSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredRequests.length === 0) return;
    
    setIsBulkSubmitting(true);
    try {
      const scheduledDate = Timestamp.fromDate(new Date(selectedDate));
      const ids = filteredRequests.map(r => r.id!).filter(Boolean);
      
      await bulkUpdatePickupStatus(ids, 'scheduled', scheduledDate);
      gabayToast.success("Success", `Scheduled ${ids.length} pickups.`);
      setIsBulkModalOpen(false);
      fetchRequests();
    } catch (err) {
      gabayToast.error("Batch Error", "Could not schedule all requests.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleViewDetails = (req: PickupRequest) => {
    setSchedulingRequest(req);
    setCriteria({
      segregated: req.rating?.criteria ? req.rating.criteria.includes('segregated') : false,
      clean: req.rating?.criteria ? req.rating.criteria.includes('clean') : false,
      packaged: req.rating?.criteria ? req.rating.criteria.includes('packaged') : false
    });
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
    const matchesType = filterType === 'all' || req.status === 'collected' || req.wasteType === filterType; 
    // Note: completed pickups still show up if 'all' type is selected, 
    // but usually, operators want to filter active ones by type.
    // Let's refine:
    const finalMatchesType = filterType === 'all' || req.wasteType === filterType;

    return matchesSearch && matchesStatus && finalMatchesType;
  });

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Cluster */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Pickups
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Review, schedule, and oversee community-wide collection requests.</p>
            </div>
            <button 
              onClick={fetchRequests} 
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white active:scale-95 transition-all"
            >
              <RotateCw className={`w-5 h-5 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-white">
            {/* Unified Toolbar Container */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 flex-1">
              
              {/* Search Control */}
              <form onSubmit={handleSearch} className="relative group w-full lg:max-w-xs xl:max-w-md">
                <input
                  type="text"
                  placeholder="Search by resident or ID..."
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

              {/* Status Tabs - Scrollable on mobile */}
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

            {/* Utility Row: Category Dropdown + View Switchers */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                {/* Integrated Type Dropdown */}
                <div className="relative flex-1 lg:flex-none lg:min-w-[200px]">
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
                            <span className="flex flex-col">
                                <span>{type === 'all' ? 'All categories' : WASTE_TYPE_LABELS[type].label}</span>
                            </span>
                            {filterType === type && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                        ))}
                        </div>
                    </>
                    )}
                </div>

                {/* View Switchers */}
                <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/5">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-900 shadow-lg' : 'text-brand-100 hover:text-white'}`}>
                    <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-brand-900 shadow-lg' : 'text-brand-100 hover:text-white'}`}>
                    <MapIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Bulk Actions */}
                {filterStatus === 'pending' && filteredRequests.length > 0 && (
                  <div className="flex bg-brand-600 p-1 rounded-xl shadow-lg shadow-brand-900/10">
                    <button 
                      onClick={() => setIsBulkModalOpen(true)}
                      className="flex items-center justify-center px-4 py-1.5 text-white font-semibold capitalize text-sm rounded-lg hover:bg-white/10 transition-all group gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Bulk Schedule
                    </button>
                  </div>
                )}

            </div>
          </div>
        </div>

        {/* Workspace Area */}
        {loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-brand-900/40">Loading...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-2xl shadow-brand-900/5 overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-200px)]">

            {viewMode === 'list' && (
              <PickupDataTable 
                data={filteredRequests}
                onViewOnMap={handleViewOnMap}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={handleViewDetails}
                role="operator"
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
                  onAccept={(id) => handleUpdateStatus(id, 'scheduled')}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 h-[600px] flex flex-col items-center justify-center text-center shadow-sm p-20">
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-200 mb-6 border border-gray-100 shadow-inner">
              <Activity className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pickups</h3>
            <p className="text-sm font-semibold text-gray-500 max-w-xs mb-8">There are no pickups found here.</p>
            <button onClick={() => { 
                setSearchInput(""); 
                setAppliedSearch(""); 
                setFilterStatus("pending"); 
                setFilterType("all");
                setIsTypeDropdownOpen(false);
              }} className="px-8 py-3 bg-brand-900 text-white rounded-xl font-semibold text-sm transition-all hover:bg-black active:scale-95 shadow-xl shadow-brand-950/20">
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Dispatch Side Panel (Drawer) */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${schedulingRequest ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setSchedulingRequest(null)} />
        <div className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${schedulingRequest ? "translate-x-0" : "translate-x-full"}`}>
          <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white flex-shrink-0 relative">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight capitalize">Pickup Details</h2>
                <div className="flex items-center gap-2 mt-1.5 opacity-80">
                  <p className="text-xs font-semibold capitalize">{schedulingRequest?.residentName}</p>
                  <span className="w-1 h-1 bg-white/30 rounded-full" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-200">ID: {schedulingRequest?.id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => {
                setSchedulingRequest(null);
                setCriteria({ segregated: false, clean: false, packaged: false });
              }} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all active:scale-95"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {schedulingRequest && (
            <form onSubmit={handleConfirmSchedule} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                
                {/* Photo Evidence */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600/70 px-1">Request Photo</label>
                  {schedulingRequest.imageUrl ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-gray-100 shadow-2xl shadow-brand-900/10">
                      <img src={schedulingRequest.imageUrl} className="w-full h-full object-cover" alt="Pickup Evidence" />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                      <p className="text-xs font-semibold capitalize">No photo provided</p>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Waste Type</p>
                    <p className="text-sm font-semibold capitalize text-gray-800">
                      {WASTE_TYPE_LABELS[schedulingRequest.wasteType].label}
                    </p>
                  </div>
                  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Requested On</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {schedulingRequest.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Extras & Notes */}
                <div className="space-y-6">
                  {schedulingRequest.extras && schedulingRequest.extras.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600/70 px-1">Special Attributes</label>
                      <div className="flex flex-wrap gap-2">
                        {schedulingRequest.extras.map((extra, idx) => (
                          <span key={idx} className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-brand-100 shadow-sm capitalize">
                            {extra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600/70 px-1">Resident Notes</label>
                    <div className="p-6 bg-amber-50/30 rounded-3xl border border-amber-100/50 shadow-inner">
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed italic">
                        "{schedulingRequest.notes || "No specific instructions provided."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule & Rating Action */}
                <div className="space-y-8 pt-6 mt-6 border-t border-gray-100">
                  {(schedulingRequest.status === 'scheduled' || schedulingRequest.status === 'collected') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
                          {schedulingRequest.status === 'collected' ? 'Waste Audit (Recorded)' : 'Waste Audit (Required)'}
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const count = Object.values(criteria).filter(Boolean).length;
                            const score = count === 3 ? 5 : count === 2 ? 4 : count === 1 ? 2 : 1;
                            return (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        {[
                          { id: 'segregated', label: 'Segregated', desc: 'Proper waste separation' },
                          { id: 'clean', label: 'Clean & Dry', desc: 'No residue or moisture' },
                          { id: 'packaged', label: 'Packaged', desc: 'Tied bags, no leaks' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            disabled={schedulingRequest.status === 'collected'}
                            onClick={() => setCriteria(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof criteria] }))}
                            className={`flex items-center text-left p-4 rounded-2xl border transition-all ${
                              criteria[item.id as keyof typeof criteria]
                              ? "bg-brand-50 border-brand-200 shadow-sm"
                              : "bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200"
                            } ${schedulingRequest.status === 'collected' && 'opacity-80 active:scale-100'}`}
                          >
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${criteria[item.id as keyof typeof criteria] ? 'text-brand-900' : 'text-gray-700'}`}>
                                {item.label}
                              </p>
                              <p className="text-[10px] font-semibold text-gray-500">{item.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              criteria[item.id as keyof typeof criteria] ? "bg-brand-600 border-brand-600" : "border-gray-100"
                            }`}>
                              {criteria[item.id as keyof typeof criteria] && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600 px-1">
                      {schedulingRequest.status === 'pending' ? 'Set Collection Date' : 'Collection Date (Confirmed)'}
                    </label>
                    <input
                      type="date"
                      value={schedulingRequest.scheduledDate ? schedulingRequest.scheduledDate.toDate().toISOString().split('T')[0] : selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      readOnly={schedulingRequest.status === 'collected'}
                      className={`w-full px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all shadow-xl shadow-brand-900/5 ${schedulingRequest.status === 'collected' && 'bg-gray-50 text-gray-500'}`}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between gap-4">
                <button type="button" onClick={() => {
                  setSchedulingRequest(null);
                  setCriteria({ segregated: false, clean: false, packaged: false });
                }} className={`px-6 py-3 text-gray-500 font-semibold capitalize text-sm hover:text-brand-600 transition-colors ${schedulingRequest.status === 'collected' && 'w-full bg-gray-100 rounded-2xl hover:bg-gray-200'}`}>
                  {schedulingRequest.status === 'collected' ? 'Close Record' : 'Close'}
                </button>
                {schedulingRequest.status !== 'collected' && (
                  <button 
                    type="submit" 
                    disabled={isSubmittingSchedule} 
                    className={`flex-1 px-8 py-3 text-white font-semibold capitalize text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${
                      schedulingRequest.status === 'pending' 
                        ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-900/10' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                    }`}
                  >
                    {isSubmittingSchedule ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      schedulingRequest.status === 'pending' ? "Save Schedule" : "Complete Pickup"
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bulk Scheduling Modal */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-300 ${isBulkModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-md" onClick={() => setIsBulkModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold tracking-tight">Bulk Schedule</h3>
                <button onClick={() => setIsBulkModalOpen(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs font-semibold text-brand-200 capitalize">
                Assigning date for {filteredRequests.length} pending requests
              </p>
            </div>

            <form onSubmit={handleBulkSchedule} className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-600 px-1">Common Collection Date</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-500 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-14 pr-6 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all"
                    required
                  />
                </div>
                <p className="text-[10px] font-semibold text-gray-400 pl-1 leading-relaxed">
                  Note: This will move all currently filtered pending requests to the scheduled state.
                </p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-4 text-gray-500 font-semibold capitalize text-sm hover:text-brand-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isBulkSubmitting} className="flex-[2] py-4 bg-brand-600 text-white font-semibold capitalize text-sm rounded-2xl shadow-xl shadow-brand-900/10 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isBulkSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Confirm Approval
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
