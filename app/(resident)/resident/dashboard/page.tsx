"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Leaf, 
  Trophy, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Truck,
  Wind,
  Star,
  Zap,
  BookOpen,
  MapPin,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { getUserActiveRequest, getMyRequests, PickupRequest } from "@/lib/db/requests";
import Link from "next/link";

// @ts-ignore
import { regions, provinces, cities, barangays } from "select-philippines-address";

export default function ResidentDashboardPage() {
  const { uid, displayName, points } = useAppSelector(state => state.auth);
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<PickupRequest[]>([]);
  const [userAddress, setUserAddress] = useState<string>("Not set");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const fetchData = async () => {
      try {
        const [active, history] = await Promise.all([
          getUserActiveRequest(uid),
          getMyRequests(uid)
        ]);
        setActiveRequest(active);
        setRequestHistory(history);

        // Fetch latest profile for address
        const token = await (await import("@/lib/firebase/client")).auth.currentUser?.getIdToken();
        if (token) {
          const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.address) {
              try {
                // Resolve names from codes
                const [regRes, provRes, cityRes, brgyRes] = await Promise.all([
                  regions(),
                  data.address.region ? provinces(data.address.region) : Promise.resolve([]),
                  data.address.province ? cities(data.address.province) : Promise.resolve([]),
                  data.address.city ? barangays(data.address.city) : Promise.resolve([])
                ]);

                const regName = regRes.find((r: any) => r.region_code === data.address.region)?.region_name;
                const provName = provRes.find((p: any) => p.province_code === data.address.province)?.province_name;
                const cityName = cityRes.find((c: any) => c.city_code === data.address.city)?.city_name;
                const brgyName = brgyRes.find((b: any) => b.brgy_code === data.address.barangay)?.brgy_name;

                const fullAddress = [
                  data.address.street,
                  brgyName,
                  cityName,
                  provName,
                  regName
                ].filter(Boolean).join(", ");
                
                setUserAddress(fullAddress || "No location set");
              } catch (addrErr) {
                console.error("Address resolution error:", addrErr);
                // Fallback to basic street/barangay if resolution fails
                setUserAddress(data.address.street || "Address set (error resolving names)");
              }
            }
          }
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid]);

  const firstName = displayName?.split(' ')[0] || "Resident";
  const totalPoints = points || 0;
  const pickupsCompleted = requestHistory.filter(r => r.status === 'collected').length;

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
      {/* Header Hero */}
      <div className="absolute top-0 left-0 right-0 h-[28rem] sm:h-72 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-8 mx-auto">
        
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-emerald-400">{firstName}</span>
            </h1>
            <p className="text-brand-100/60 text-sm font-medium max-w-md">
                Check your points and waste requests here.
            </p>
          </div>

          {/* Points/Quick Stats Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-2xl w-full sm:w-auto">
              <div className="px-4 py-2 sm:px-6">
                <p className="text-xs font-bold text-brand-200">Points</p>
                <p className="text-xl font-bold text-white">{totalPoints.toLocaleString()}</p>
              </div>
              <Link href="/resident/pickup-request" className="flex items-center justify-center h-12 sm:h-full px-5 py-3 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                New request
              </Link>
          </div>
        </div>

        {/* Top Tier: Status & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            
            {/* Status Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-xs font-bold border border-brand-100">
                            Request status
                        </span>
                    </div>
                    
                    {activeRequest ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20 flex-shrink-0">
                                    <Truck className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize leading-none">{activeRequest.status}</h3>
                                    <p className="text-sm font-semibold text-brand-600 mt-1 italic">Pickup soon</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-400">
                                    <span>Progress</span>
                                    <span>{activeRequest.status === 'pending' ? '30%' : '70%'}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-brand-600 transition-all duration-1000 ${activeRequest.status === 'pending' ? 'w-1/3' : 'w-2/3'}`} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 flex-shrink-0">
                                <Leaf className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-400 leading-tight">No requests now</h3>
                                <p className="text-sm font-medium text-gray-400">You don't have any waste requests for now.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-72 bg-gray-50 p-6 sm:p-8 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-6 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 border border-gray-100 flex-shrink-0">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-400 mb-0.5">Home address</p>
                            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{userAddress}</p>
                        </div>
                    </div>
                    <Link href="/resident/pickup-request" className="flex items-center justify-center w-full h-12 px-5 bg-gray-900 text-white rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                        View map
                    </Link>
                </div>
            </div>

            {/* Success KPI Card */}
            <div className="lg:col-span-4 bg-brand-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden group">
                <Star className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
                <div className="relative z-10 space-y-6 sm:space-y-8">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-brand-300 mb-1">Successful pickups</p>
                        <h3 className="text-4xl sm:text-5xl font-bold tracking-tighter">{pickupsCompleted}</h3>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 font-bold uppercase tracking-widest opacity-70">Activity record</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Tier: History & Help */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Activity List */}
          <div className="lg:col-span-8 space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock className="w-4 h-4" />
                Recent history
              </h4>
              <div className="grid gap-3">
                  {requestHistory.length > 0 ? (
                      requestHistory.slice(0, 4).map((request, index) => (
                          <div key={request.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all group gap-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-shrink-0">
                                      <Truck className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <h5 className="text-sm font-bold text-gray-900">Pickup #{request.id?.slice(-4) || '....'}</h5>
                                      <p className="text-xs font-medium text-gray-400">
                                          {request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                      </p>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full capitalize ${
                                      request.status === 'collected' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'
                                  }`}>
                                      {request.status}
                                  </span>
                              </div>
                          </div>
                      ))
                  ) : (
                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <Zap className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400">No activity recorded</p>
                    </div>
                  )}
              </div>
          </div>

          {/* Help Sidebar */}
          <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 tracking-tight">Help guide</h4>
                    <p className="text-sm font-medium text-gray-500 mt-2">Need help with your trash? Read our guide.</p>
                  </div>
                  <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                      <p className="text-xs font-bold text-brand-700 flex items-center gap-2">
                        <Star className="w-3 h-3 fill-current" /> Tip
                      </p>
                      <p className="text-xs font-medium text-brand-800 mt-2 leading-relaxed">
                        Clean your plastic bottles to get extra points.
                      </p>
                  </div>
                  <Link href="/resident/guidance" className="flex items-center justify-center w-full h-12 px-5 py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                      View guide
                  </Link>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
