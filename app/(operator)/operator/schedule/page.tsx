"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  Truck,
  Activity,
  Loader2,
  Settings,
  Plus,
  X,
  Navigation
} from "lucide-react";
import { 
  PickupRequest, 
  getAllActiveRequests, 
  updatePickupStatus 
} from "@/lib/db/requests";
import { gabayToast } from "@/lib/toast";

export default function OperatorSchedulePage() {
  const [scheduledPickups, setScheduledPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchScheduled();
  }, [selectedDate]);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const data = await getAllActiveRequests();
      const filtered = data.filter(req => {
        if (req.status !== 'scheduled' || !req.scheduledDate) return false;
        const d = req.scheduledDate.toDate();
        return (
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      });
      setScheduledPickups(filtered);
    } catch (err) {
      gabayToast.error("Load Failed", "Could not sync list.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updatePickupStatus(id, 'collected');
      gabayToast.success("Success", "Pickup done.");
      fetchScheduled();
    } catch (err) {
      gabayToast.error("Error", "Could not save.");
    }
  };

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 animate-in fade-in duration-700">
      
      {/* Dark Emerald Header Accent */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Header Cluster */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <h1 className="text-3xl font-black text-white tracking-tight italic">Pickup List</h1>
            
            <div className="flex flex-col xl:flex-row gap-4 items-center">
              <div className="flex items-center bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-xl">
                <button 
                  onClick={() => changeDate(-1)}
                  className="p-2 text-brand-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="px-6 flex flex-col items-center min-w-[200px]">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Pick a Date</span>
                  <span className="text-sm font-semibold text-white tracking-wide">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <button 
                  onClick={() => changeDate(1)}
                  className="p-2 text-brand-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={() => setSelectedDate(new Date())}
                className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-14 w-14 bg-brand-500 rounded-2xl shadow-xl shadow-brand-950/20 flex flex-col items-center justify-center text-white border border-brand-400">
                <span className="text-[10px] font-black leading-none">{scheduledPickups.length}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Jobs</span>
            </div>
          </div>
        </div>

        {/* List Workspace */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-brand-900/5 overflow-hidden min-h-[500px] flex flex-col">
            
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 italic underline decoration-brand-500">Scheduled Pickups</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">List of pickups for today</p>
                </div>
                <Truck className="w-5 h-5 text-brand-600" />
            </div>

            <div className="p-8 flex-1">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                        <p className="text-sm font-semibold text-gray-400">Loading...</p>
                    </div>
                ) : scheduledPickups.length > 0 ? (
                    <div className="space-y-4">
                        {scheduledPickups
                          .map((req) => (
                            <div key={req.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-brand-900/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-[6px] border-l-brand-600">
                                
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100 group-hover:bg-brand-50 transition-colors">
                                        <Navigation className="w-6 h-6" />
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900">{req.residentName}</span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-brand-100 bg-brand-50 text-brand-700`}>
                                                {req.wasteType}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" />
                                            {req.id?.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleComplete(req.id!)}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-100 mb-6 border border-gray-100">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 italic">No Pickups</h4>
                        <p className="text-sm font-semibold text-gray-400 mt-2 max-w-[200px]">
                            There are no pickups scheduled for this date.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
