"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Leaf, 
  ShieldCheck, 
  BarChart3, 
  MapPin, 
  ArrowUpRight,
  ChevronDown,
  Smartphone,
  Globe
} from "lucide-react";
import PWAInstall from "@/components/shared/PWAInstall";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      
      {/* Dynamic Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-[60] py-6 px-6 sm:px-12 flex justify-between items-center transition-all bg-white/50 backdrop-blur-xl border-b border-gray-100/20">
        <div className="flex items-center group cursor-pointer">
           <Image 
             src="/logo/gabaylogo.svg" 
             alt="GABAY Logo" 
             width={140} 
             height={40} 
             className="w-auto h-10 object-contain drop-shadow-sm group-hover:-translate-y-1 transition-transform" 
             style={{ width: "auto" }}
             priority
           />
        </div>
        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-600 transition-colors">Solutions</Link>
          <Link href="#impact" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-600 transition-colors">Our Impact</Link>
          <div className="h-4 w-px bg-gray-200" />
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-brand-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            Access Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Abstract Background Patterns */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full border-[80px] border-brand-50/50 opacity-40 z-0 animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full border-[40px] border-brand-100/30 opacity-60 z-0" />
        
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
           <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-brand-50 border border-brand-100 mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-ping" />
              <span className="text-[10px] font-black text-brand-700 uppercase tracking-[0.2em]">NextGen Waste Logistics Platform</span>
           </div>

           <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700">
                Future-proofing <br/>
                <span className="text-brand-500">sustainability.</span>
              </h1>
              <p className="text-lg md:text-xl font-medium text-gray-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
                A high-precision digital architecture empowering LGUs and communities to streamline waste collections and track environmental impact in real-time.
              </p>
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in duration-1000 delay-300">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-12 py-5 bg-brand-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Launch Resident Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-12 py-5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover-shadow-xl transition-all active:scale-95"
              >
                Join Community
              </Link>
           </div>

           <div className="pt-12 animate-bounce">
              <ChevronDown className="w-6 h-6 mx-auto text-gray-300" />
           </div>
        </div>
      </section>

      {/* Trust Section / Portals */}
      <section id="features" className="py-24 bg-gray-50/50 relative border-y border-gray-100">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
              <div className="max-w-xl space-y-4">
                 <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Operational Roles</p>
                 <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">Tailored solutions for <br/>every stakeholder.</h2>
              </div>
              <p className="text-sm font-semibold text-gray-400 max-w-sm leading-relaxed tracking-tight">
                Connect your entire waste management ecosystem through our specialized portal architecture.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Resident Card */}
              <div className="group relative p-10 rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all">
                       <Smartphone className="w-6 h-6" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter">Resident</h3>
                 <p className="text-sm font-bold text-gray-400 leading-relaxed mb-8 tracking-tight">Schedule pickups, scan waste with AI, and track your recycling rewards from one app.</p>
                 <Link href="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 group-hover:gap-4 transition-all">
                    Access Portal <ArrowUpRight className="w-4 h-4" />
                 </Link>
                 <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-brand-50 opacity-40 group-hover:bg-brand-100 transition-colors" />
              </div>

              {/* Collector Card */}
              <div className="group relative p-10 rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all">
                       <MapPin className="w-6 h-6" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter">Collector</h3>
                 <p className="text-sm font-bold text-gray-400 leading-relaxed mb-8 tracking-tight">Real-time route optimization, instant QR scanning, and pickup verification for field operations.</p>
                 <Link href="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 group-hover:gap-4 transition-all">
                    Connect Truck <ArrowUpRight className="w-4 h-4" />
                 </Link>
                 <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-brand-50 opacity-40 group-hover:bg-brand-100 transition-colors" />
              </div>

              {/* Operator Card */}
              <div className="group relative p-10 rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all">
                       <BarChart3 className="w-6 h-6" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tighter">Operator</h3>
                 <p className="text-sm font-bold text-gray-400 leading-relaxed mb-8 tracking-tight">Advanced dispatching, data analytics, and fleet management for city logistics operations.</p>
                 <Link href="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 group-hover:gap-4 transition-all">
                    Admin Dashboard <ArrowUpRight className="w-4 h-4" />
                 </Link>
                 <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-brand-50 opacity-40 group-hover:bg-brand-100 transition-colors" />
              </div>
           </div>
        </div>
      </section>

      {/* Impact / Stats Section (Full Redesign) */}
      <section id="impact" className="py-24 overflow-hidden relative bg-white">
         <div className="container mx-auto px-6">
            <div className="bg-brand-950 rounded-[4rem] p-12 md:p-24 relative overflow-hidden group border border-white/5">
               {/* Premium Geometric Circles (Matching Login Page) */}
               <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full border-[40px] border-brand-800/20 z-0 animate-pulse" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full border-[30px] border-brand-500/10 z-0" />
               
               <div className="relative z-10 space-y-20">
                  {/* Header */}
                  <div className="max-w-3xl space-y-6">
                     <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-brand-400/10 border border-brand-400/20">
                        <Leaf className="w-4 h-4 text-brand-400" />
                        <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em]">Environmental Impact</span>
                     </div>
                     <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] lg:max-w-2xl">
                        Measurable change <br/>
                        <span className="text-brand-400">in every sweep.</span>
                     </h2>
                  </div>

                  {/* Glassmorphism Impact Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group/card">
                        <p className="text-6xl font-black text-white tracking-tighter mb-2">100%</p>
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-6">Digitized Logs</p>
                        <p className="text-xs font-semibold text-brand-100/40 leading-relaxed group-hover/card:text-brand-100/80 transition-colors">
                           Eliminating paperwork and providing instant collection verification for every household.
                        </p>
                     </div>
                     
                     <div className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group/card">
                        <p className="text-6xl font-black text-white tracking-tighter mb-2">0%</p>
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-6">Missed Pickups</p>
                        <p className="text-xs font-semibold text-brand-100/40 leading-relaxed group-hover/card:text-brand-100/80 transition-colors">
                           Strategic field monitoring ensures that no waste category is left behind in any community.
                        </p>
                     </div>

                     <div className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group/card">
                        <p className="text-6xl font-black text-white tracking-tighter mb-2">Live</p>
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-6">GPS Tracking</p>
                        <p className="text-xs font-semibold text-brand-100/40 leading-relaxed group-hover/card:text-brand-100/80 transition-colors">
                           Real-time fleet intelligence allowing LGUs to monitor every collection truck simultaneously.
                        </p>
                     </div>
                  </div>

                  {/* Partner Spotlight */}
                  <div className="pt-12 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-brand-400 flex items-center justify-center text-brand-950 shadow-[0_0_30px_rgba(95,196,83,0.3)]">
                              <ShieldCheck className="w-8 h-8" />
                           </div>
                           <h4 className="text-2xl font-black text-white uppercase tracking-tight">Eco-Logistics Certified</h4>
                        </div>
                        <p className="text-lg font-medium text-brand-100/70 leading-relaxed italic">
                          "Transitioning to digital logistics allowed us to identify bottlenecks in our waste stream and improve recycling rates by 40% in just six months."
                        </p>
                     </div>
                     <div className="lg:pl-20">
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 inline-flex items-center gap-6">
                           <div className="w-16 h-16 rounded-full bg-brand-400 flex items-center justify-center text-brand-950 font-black text-2xl shadow-xl">L</div>
                           <div>
                              <p className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Lucena Environmental Office</p>
                              <p className="text-[10px] font-bold text-brand-400/60 uppercase tracking-widest">Official LGU Pilot Partner</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-gray-100">
         <div className="container mx-auto px-6 text-center space-y-8">
            <Image 
              src="/logo/gabaylogo.svg" 
              alt="GABAY Logo" 
              width={120} 
              height={32} 
              className="w-auto h-8 object-contain opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all mx-auto" 
              style={{ width: "auto" }}
            />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">© 2026 GABAY EcoTrack Platform. All Rights Reserved.</p>
            <div className="flex justify-center gap-8">
               <div className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"><ShieldCheck className="w-5 h-5" /></div>
               <div className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"><Globe className="w-5 h-5" /></div>
            </div>
         </div>
      </footer>

      {/* PWA Integration */}
      <PWAInstall />
    </div>
  );
}
