"use client";

import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-100 shadow-xl shadow-brand-900/5">
        <Construction className="w-10 h-10 text-brand-600 animate-bounce" />
      </div>
      
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Module in Development</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          The GABAY Engineers are currently establishing the telemetry links for this operational hub.
        </p>
      </div>

      <div className="mt-12">
        <Link 
            href="/operator/dashboard"
            className="flex items-center justify-center py-4 px-10 text-white font-black uppercase tracking-widest text-[10px] bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xl shadow-brand-900/10 transition-all active:scale-[0.98] group"
        >
            <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
            Operational Center
        </Link>
      </div>
    </div>
  );
}
