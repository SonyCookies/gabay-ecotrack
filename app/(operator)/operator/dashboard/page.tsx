"use client";

import { 
  Truck, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  PieChart, 
  ArrowUpRight, 
  Users, 
  Navigation,
  Activity,
  Trash2
} from "lucide-react";

export default function OperatorDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            Operations Center
            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Direct Sync
            </span>
          </h2>
          <p className="text-sm font-bold text-gray-500">
            Monitoring localized waste dynamics and fleet performance for <span className="text-brand-600">Sector-7 Hub</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="pl-2 pr-4 py-1 border-r border-gray-100 text-right">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today&apos;s Orbit</div>
            <div className="text-xs font-black text-gray-900">Oct 24, 2026</div>
          </div>
          <button className="bg-brand-600 hover:bg-brand-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3 px-6 rounded-xl shadow-lg shadow-brand-900/10 transition-all active:scale-95">
            Fleet Ops Config
          </button>
        </div>
      </div>

      {/* Operator KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Active Fleets */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-brand-900/5 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Trucks</p>
              <h3 className="text-3xl font-black text-gray-900">14<span className="text-sm font-bold text-gray-300 ml-1">/20</span></h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest relative z-10">
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            <span>Deployment steady</span>
          </div>
        </div>

        {/* KPI: Waste Collected */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-brand-900/5 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-50 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Metric</p>
              <h3 className="text-3xl font-black text-gray-900">8.2<span className="text-sm font-bold text-gray-300 ml-1">tons</span></h3>
            </div>
            <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] font-black text-brand-600 uppercase tracking-widest relative z-10">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
            <span>+12% vs last shift</span>
          </div>
        </div>

        {/* KPI: Collection Progress */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-brand-900/5 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Route Status</p>
              <h3 className="text-3xl font-black text-gray-900">72%</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 relative z-10">
            <div className="w-full bg-blue-50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[72%]" />
            </div>
          </div>
        </div>

        {/* KPI: Pending Tickets */}
        <div className="bg-white p-6 rounded-3xl border border-red-50 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-brand-900/5 transition-all">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-50 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Reports</p>
              <h3 className="text-3xl font-black text-gray-900">5</h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[10px] font-black text-red-600 uppercase tracking-widest relative z-10">
            <span>High Priority Unassigned</span>
          </div>
        </div>

      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fleet Deployment Chart/Map Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Geo-Spatial Deployment</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Live Fleet Distribution (Sector-7)</p>
            </div>
            <div className="flex gap-2">
                <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
                <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/20 active:scale-95 transition-all">
                    Full Map
                </button>
            </div>
          </div>
          
          <div className="p-10 flex-1 flex flex-col items-center justify-center min-h-[400px] bg-gray-50/30 relative">
             {/* Map Grid Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             
             <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-24 h-24 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <Navigation className="w-10 h-10 text-brand-600 animate-bounce" />
                </div>
             </div>
             
             <div className="mt-8 text-center space-y-2">
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Integrating Satellite Telemetry...</p>
                <p className="text-[10px] font-bold text-gray-400 max-w-xs uppercase tracking-tight">
                    The GIS mapping engine is ready for deployment. Connect Mapbox or Google Maps to visualize real-time truck coordinates.
                </p>
             </div>
          </div>
        </div>

        {/* Upcoming Collections Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-50">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Upcoming Slates</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Next 24-hours forecast</p>
            </div>
            
            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto custom-scrollbar">
                {[
                    { zone: "Zone Sector A", time: "06:00 AM", load: "High", color: "text-brand-600" },
                    { zone: "Green Gardens District", time: "08:30 AM", load: "Moderate", color: "text-blue-600" },
                    { zone: "Downtown Commercial", time: "11:00 AM", load: "High", color: "text-red-500" },
                    { zone: "West Industrial Block", time: "01:45 PM", load: "Low", color: "text-emerald-600" },
                    { zone: "Skyline Residences", time: "04:00 PM", load: "Moderate", color: "text-orange-500" },
                ].map((slate, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-md transition-all">
                                <Calendar className="w-4 h-4 mb-0.5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{slate.time}</p>
                                <p className="text-sm font-black text-gray-900">{slate.zone}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${slate.color}`}>
                            {slate.load}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="p-6 bg-gray-50/50 text-center border-t border-gray-50">
                <button className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">
                    View Master Calendar
                </button>
            </div>
        </div>

      </div>

    </div>
  );
}
