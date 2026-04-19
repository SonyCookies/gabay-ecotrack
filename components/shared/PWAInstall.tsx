"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Monitor, Smartphone, Globe } from "lucide-react";
import Image from "next/image";

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt anyway for iOS instructions after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-6 sm:p-8">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 rounded-full bg-brand-900/5 blur-3xl" />

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* App Icon Circle */}
          <div className="relative w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center border border-gray-100 p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
             <Image 
               src="/icons/icon-512x512.png" 
               alt="GABAY Logo" 
               width={80} 
               height={80} 
               className="rounded-2xl"
             />
             <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
                <PlusSquare className="w-4 h-4" />
             </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Install GABAY EcoTrack</h3>
            <p className="text-sm font-bold text-gray-500 max-w-[260px] mx-auto leading-relaxed">
              {isIOS 
                ? "Experience Gabay like a native app on your iPhone. Faster, smoother, and brand-exclusive." 
                : "Get the full experience on your home screen. Fast access and premium logistics at your fingertips."
              }
            </p>
          </div>

          {isIOS ? (
            <div className="w-full bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">iOS Instructions</p>
               <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                       <Share className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">Tap the <span className="text-blue-600">Share</span> icon in Safari</p>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-700 border border-gray-100 group-hover:bg-gray-50 transition-colors">
                       <PlusSquare className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">Select <span className="text-gray-900 font-black">"Add to Home Screen"</span></p>
                  </div>
               </div>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full py-5 bg-brand-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-brand-900/30 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              Start One-Click Install
              <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          )}

          <div className="flex items-center gap-6 pt-2">
             <div className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                <Monitor className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-widest">Desktop</span>
             </div>
             <div className="flex flex-col items-center gap-1.5 opacity-100">
                <Smartphone className="w-4 h-4 text-brand-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-500">Mobile</span>
             </div>
             <div className="flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                <Globe className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-widest">Web</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
