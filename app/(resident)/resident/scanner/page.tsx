"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Camera, 
  RotateCw, 
  Scan, 
  X, 
  Loader2, 
  CheckCircle2, 
  Info, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { WASTE_CATEGORIES } from "@/lib/data/wasteEducation";
import { gabayToast } from "@/lib/toast";

interface ScanResult {
  category: string;
  identifiedItem: string;
  confidence: number;
  briefAdvice: string;
  isMock?: boolean;
}

export default function WasteScannerPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manage camera stream via useEffect
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initCamera = async () => {
      if (isCameraActive && !capturedImage) {
        setError(null);
        
        // Check for secure context / API availability
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const msg = "Camera API not available. Please ensure you are using HTTPS or localhost.";
          setError(msg);
          setIsCameraActive(false);
          gabayToast.error("Security Error", msg);
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            activeStream = stream;
          }
        } catch (err: any) {
          console.error("Camera Error:", err);
          let msg = "Could not access camera.";
          if (err.name === "NotAllowedError") msg = "Camera permission denied.";
          setError(msg);
          setIsCameraActive(false);
          gabayToast.error("Camera Error", msg);
        }
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, facingMode, capturedImage]);

  const startCamera = () => {
    setIsCameraActive(true);
    setCapturedImage(null);
    setResult(null);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Capture frame
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // Send to API
  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/waste-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage })
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const data = await response.json();
      setResult(data);
      
      if (data.isMock) {
        gabayToast.warning("Demo Mode", "Using simulated identification. Add your API key to enable real detection.");
      } else {
        gabayToast.success("Identification Complete", `Identified as ${data.identifiedItem}`);
      }
    } catch (err) {
      gabayToast.error("Analysis Error", "We couldn't identify the waste at this time.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    startCamera();
  };


  // Find category details from existing data
  const categoryDetails = result ? WASTE_CATEGORIES.find(c => c.id === result.category) : null;

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
      {/* Header Background */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
        {/* Header Cluster */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                AI Waste Scanner
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Use your camera to identify and categorize waste instantly.</p>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left Side: Scanner / Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[3/4] sm:aspect-square bg-black rounded-[3rem] border-8 border-gray-100 shadow-2xl overflow-hidden group">
              
              {!isCameraActive && !capturedImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                    <Camera className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Camera Required</h3>
                    <p className="text-sm font-medium text-white/40 max-w-xs mx-auto">Grant camera access to start scanning your items.</p>
                  </div>
                  <button 
                    onClick={startCamera}
                    className="px-10 py-4 bg-white text-black rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-100 active:scale-95 transition-all"
                  >
                    Launch Camera
                  </button>
                </div>
              ) : (
                <>
                  {/* Real-time Video or Captured Image */}
                  {capturedImage ? (
                    <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-500">
                      <Image 
                        src={capturedImage} 
                        alt="Captured waste" 
                        fill 
                        className="object-cover"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white space-y-4">
                          <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-brand-400" />
                            <div className="absolute inset-0 animate-ping rounded-full border-2 border-brand-400 opacity-20" />
                          </div>
                          <p className="text-sm font-black uppercase tracking-widest animate-pulse">Analyzing Item...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* UI Overlays */}
                  {!isAnalyzing && (
                    <>
                      {/* Scanning Line Animation */}
                      {isCameraActive && !capturedImage && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-scan z-20" />
                      )}

                      {/* Controls Bottom */}
                      <div className="absolute inset-x-0 bottom-6 px-4 flex items-center justify-center gap-3 z-30 sm:px-8 sm:bottom-8 sm:justify-between">
                        {capturedImage ? (
                          <div className="flex items-center gap-3 w-full justify-center sm:w-auto">
                            <button 
                              onClick={reset}
                              disabled={isAnalyzing}
                              className="w-14 h-14 flex-shrink-0 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90"
                            >
                              <RotateCw className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={analyzeImage}
                              disabled={isAnalyzing}
                              className="flex-1 sm:flex-none px-6 sm:px-10 py-4 bg-brand-500 text-white rounded-2xl text-[10px] sm:text-sm font-black uppercase tracking-widest shadow-2xl shadow-brand-500/40 hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3"
                            >
                              {result ? "Re-Analyze" : "Analyze Result"}
                              <Zap className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full sm:justify-center sm:gap-6">
                            <button 
                              onClick={toggleCamera}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90"
                            >
                              <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <button 
                              onClick={captureImage}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-all group/btn"
                            >
                               <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full border-4 border-black/5 flex items-center justify-center group-hover/btn:border-brand-500 transition-colors">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/90 group-hover/btn:bg-brand-500 transition-colors" />
                              </div>
                            </button>
                            <button 
                              onClick={() => { stopCamera(); setCapturedImage(null); }}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-all active:scale-90"
                            >
                              <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            
            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-500">{error}</p>
              </div>
            )}
          </div>

          {/* Right Side: Analysis Results */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex-1 flex flex-col">
              
              {/* Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Identification</h2>
                <div className={`p-3 rounded-2xl ${result ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-300'}`}>
                  <Scan className="w-6 h-6" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8">
                {!result ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200">
                      <Scan className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Waiting for Scan</p>
                      <p className="text-xs font-semibold text-gray-400 max-w-[200px] leading-relaxed">
                        Capture an image of the waste item to identify its category.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Item Name */}
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">Identified As</span>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tight lowercase first-letter:uppercase">
                         {result.identifiedItem}
                       </h3>
                       <div className="flex items-center gap-2">
                         <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-brand-500 rounded-full" 
                             style={{ width: `${result.confidence * 100}%` }}
                           />
                         </div>
                         <span className="text-[10px] font-black text-gray-400">
                           {Math.round(result.confidence * 100)}% Match
                         </span>
                       </div>
                    </div>

                    {/* Category Details */}
                    {categoryDetails ? (
                      <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-${categoryDetails.color}-600`}>
                            <categoryDetails.icon className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waste Category</p>
                            <h4 className="text-lg font-black text-gray-900">{categoryDetails.title}</h4>
                          </div>
                        </div>
                        
                        <p className="text-xs font-bold text-gray-500 leading-relaxed italic border-l-4 border-brand-500 pl-4 py-1">
                          "{result.briefAdvice}"
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-red-50 border border-red-100 flex items-center gap-4">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <p className="text-xs font-bold text-red-600">Unrecognized category code: {result.category}</p>
                      </div>
                    )}

                    {/* Next Steps */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">Disposal Guidance</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="grid gap-3">
                         <div className="p-4 bg-brand-900 text-brand-50 rounded-2xl flex items-start gap-3">
                           <CheckCircle2 className="w-5 h-5 text-brand-400 mt-0.5" />
                           <p className="text-xs font-bold leading-relaxed">{categoryDetails?.instructions}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer / Tip */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                 <div className="flex items-center gap-3 text-gray-400">
                    <Info className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tip: Clear lighting improves AI detection</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
