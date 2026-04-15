"use client";

import { 
  Navigation, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Inbox,
  Trash2,
  Truck,
  History,
  Loader2,
  Star
} from "lucide-react";
import { PickupRequest, WASTE_TYPE_LABELS } from "@/lib/db/requests";

interface PickupDataTableProps {
  data: PickupRequest[];
  onViewOnMap: (lat: number, lng: number) => void;
  onUpdateStatus?: (id: string, status: PickupRequest['status']) => void; // Operator Action
  onWithdraw?: (id: string) => void; // Resident Action
  onViewDetails?: (req: PickupRequest) => void; // New: View historical audit
  role?: 'operator' | 'resident';
  loading?: boolean;
}

export default function PickupDataTable({ 
  data, 
  onViewOnMap, 
  onUpdateStatus,
  onWithdraw,
  onViewDetails,
  role = 'operator',
  loading = false
}: PickupDataTableProps) {
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'collected': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getWasteStyles = (type: string) => {
    if (type === 'bulk') return 'bg-orange-50 text-orange-600 border-orange-100';
    if (type === 'recyclable') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  // --- EMPTY STATE VIEW ---
  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500 min-h-[400px]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
          {loading ? <Loader2 className="w-10 h-10 text-brand-400 animate-spin" /> : <Inbox className="w-10 h-10 text-gray-300" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {loading ? "Synchronizing records..." : "No requests match your current filters."}
        </h3>
        {!loading && (
          <p className="text-sm font-semibold text-gray-400 max-w-xs leading-relaxed">
            There are currently no records found. Try adjusting your search or switching categories.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            <tr className="bg-brand-900 text-white shadow-md">
              <th className={`pl-8 pr-4 py-4 font-semibold text-sm capitalize border-b border-white/10 ${role === 'resident' && 'rounded-tl-xl'}`}>
                {role === 'operator' ? 'Resident info' : 'Pickup Details'}
              </th>
              <th className="px-4 py-4 font-semibold text-sm capitalize border-b border-white/10">Status & type</th>
              <th className="px-4 py-4 font-semibold text-sm capitalize border-b border-white/10">Request date</th>
              <th className="pl-4 pr-8 py-4 text-right font-semibold text-sm capitalize border-b border-white/10 rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((req, index) => (
              <tr 
                key={req.id} 
                className={`group transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-brand-50/10'
                } hover:bg-brand-50/40 hover:shadow-inner`}
              >
                {/* Column 1: Info (Contextual) */}
                <td className="pl-8 pr-4 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    {role === 'operator' ? (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-brand-600 shadow-sm group-hover:border-brand-200 transition-all font-black text-lg">
                          {req.residentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">{req.residentName}</p>
                          <p className="text-[10px] text-brand-600 font-medium opacity-60">ID: {req.id?.slice(-6).toUpperCase()}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                          req.status === 'collected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1 capitalize italic truncate max-w-[200px]">
                            "{req.notes || "No instructions provided."}"
                          </p>
                          <p className="text-[10px] text-brand-600 font-medium opacity-60">ID: {req.id?.slice(-6).toUpperCase()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </td>

                {/* Column 2: Status & Type */}
                <td className="px-4 py-5 border-b border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => req.status === 'collected' && onViewDetails?.(req)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shadow-sm tracking-tight flex items-center gap-1.5 transition-all ${getStatusStyles(req.status)} ${req.status === 'collected' && 'cursor-pointer hover:scale-105 active:scale-95'}`}
                      >
                        {req.status === 'collected' ? 'completed' : req.status}
                        {req.status === 'collected' && req.rating && (
                          <div className="flex items-center gap-0.5 border-l border-emerald-200 pl-1.5 ml-0.5">
                            <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                            <span className="text-[9px]">{req.rating.score}</span>
                          </div>
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shadow-sm tracking-tight ${getWasteStyles(req.wasteType)}`}>
                        {WASTE_TYPE_LABELS[req.wasteType].label}
                      </span>
                    </div>
                    {req.extras && req.extras.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 mb-1">
                        {req.extras.map((ex, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-bold uppercase border border-red-100/30">
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Column 3: Date */}
                <td className="px-4 py-5 border-b border-gray-100">
                  <div className="flex items-center text-gray-700 font-bold text-[11px] bg-gray-100/50 w-fit px-3 py-1.5 rounded-lg border border-gray-200/50">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-brand-500" />
                    {req.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>

                {/* Column 4: Actions (Contextual) */}
                <td className="pl-4 pr-8 py-5 text-right border-b border-gray-100">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onViewOnMap(req.lat, req.lng)}
                      className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100"
                      title="View on Map"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>

                    {role === 'operator' ? (
                       req.status === 'pending' ? (
                        <button 
                          onClick={() => onUpdateStatus?.(req.id!, 'scheduled')}
                          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-brand-900/10 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                          Schedule <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : req.status === 'scheduled' ? (
                        <button 
                          onClick={() => onUpdateStatus?.(req.id!, 'collected')}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                          Complete <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onViewDetails?.(req)}
                          className="px-6 py-2.5 bg-gray-100 text-gray-500 hover:text-brand-600 hover:bg-gray-50 hover:border-brand-200 rounded-xl text-xs font-bold uppercase flex items-center gap-2 border border-gray-200 transition-all active:scale-95"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      // Resident Actions
                      req.status === 'pending' ? (
                        <button 
                          onClick={() => onWithdraw?.(req.id!)}
                          className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all active:scale-95 shadow-sm"
                          title="Withdraw Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : req.status === 'scheduled' ? (
                        <div className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase border border-blue-100 flex items-center gap-2">
                          Confirmed <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-5 bg-gray-50/50">
        {data.map((req) => (
          <div 
            key={req.id} 
            className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-brand-900/5 overflow-hidden flex flex-col transition-all active:scale-[0.98]"
          >
            <div className="bg-brand-900 px-5 py-3 flex justify-between items-center">
               <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest">
                 {role === 'operator' ? 'Request Details' : `Order ID: ${req.id?.slice(-8).toUpperCase()}`}
               </p>
               <span 
                 onClick={() => req.status === 'collected' && onViewDetails?.(req)}
                 className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border shadow-sm flex items-center gap-1.5 transition-all ${getStatusStyles(req.status)} ${req.status === 'collected' && 'active:scale-95 cursor-pointer'}`}
               >
                  {req.status === 'collected' ? 'completed' : req.status}
                  {req.status === 'collected' && req.rating && (
                    <div className="flex items-center gap-1 border-l border-emerald-200 pl-1.5 ml-0.5">
                      <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                      <span>{req.rating.score}</span>
                    </div>
                  )}
               </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                {role === 'operator' ? (
                   <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black border border-brand-100 shadow-inner text-xl">
                      {req.residentName.charAt(0)}
                   </div>
                ) : (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                    req.status === 'collected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-brand-50 text-brand-600 border-brand-100'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-base font-bold text-gray-900 leading-tight">
                    {role === 'operator' ? req.residentName : `${WASTE_TYPE_LABELS[req.wasteType].label} Pickup`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getWasteStyles(req.wasteType)}`}>
                      {WASTE_TYPE_LABELS[req.wasteType].label}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400">#{req.id?.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-100 rounded-full" />
                <p className="text-xs text-gray-600 leading-relaxed pl-4 font-semibold italic">
                  "{req.notes || "No specific instructions provided."}"
                </p>
              </div>
            </div>

            <div className="bg-gray-50/80 border-t border-gray-100 p-4 flex items-center gap-3">
              <button 
                onClick={() => onViewOnMap(req.lat, req.lng)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold text-gray-600 uppercase shadow-sm active:bg-gray-100 transition-all"
              >
                <MapPin className="w-4 h-4 text-brand-500" />
                GPS
              </button>
              
              {role === 'operator' ? (
                req.status === 'pending' ? (
                  <button 
                    onClick={() => onUpdateStatus?.(req.id!, 'scheduled')}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-2xl text-xs font-bold uppercase shadow-lg shadow-brand-900/20 active:scale-95 transition-all"
                  >
                    Schedule <ChevronRight className="w-4 h-4" />
                  </button>
                ) : req.status === 'scheduled' ? (
                  <button 
                    onClick={() => onUpdateStatus?.(req.id!, 'collected')}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    Complete <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => onViewDetails?.(req)}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-500 hover:text-brand-600 rounded-2xl text-xs font-bold uppercase border border-gray-200 active:scale-95 transition-all"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                )
              ) : (
                // Resident Mobile Actions
                req.status === 'pending' && (
                  <button 
                    onClick={() => onWithdraw?.(req.id!)}
                    className="flex-[2] py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase border border-red-100/50 shadow-sm active:scale-95 transition-all"
                  >
                    Withdraw Request
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
