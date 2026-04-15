"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  getUserActiveRequest, 
  updatePickupStatus, 
  PickupRequest, 
  WASTE_TYPE_LABELS 
} from "@/lib/db/requests";
import { auth } from "@/lib/firebase/client";
import { gabayToast } from "@/lib/toast";
import { 
  QrCode,
  User,
  ArrowRight,
  CheckCircle2,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Package,
  Stars,
  Star,
} from "lucide-react";

export default function CollectorScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [residentData, setResidentData] = useState<any>(null);
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [criteria, setCriteria] = useState({
    segregated: false,
    clean: false,
    packaged: false
  });
  
  // Custom Scanner States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("No image chosen");
  const scannerInstance = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanTimestamp = useRef<number>(0);
  const SCAN_COOLDOWN = 2500; // 2.5 seconds between successful scans

  useEffect(() => {
    // Initialize the core engine but don't start camera automatically
    const scanner = new Html5Qrcode("reader");
    scannerInstance.current = scanner;

    return () => {
      if (scannerInstance.current?.isScanning) {
        scannerInstance.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  const startCamera = async () => {
    if (!scannerInstance.current) return;
    setScanError(null);
    try {
      setIsCameraActive(true);
      await scannerInstance.current.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.65);
            return { width: size, height: size };
          },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      setIsCameraActive(false);
      console.error("Scanner Start Error:", err);
      
      let errorMessage = "Could not start the camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Camera permission denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No back camera found on this device.";
      } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        errorMessage = "Camera requires a secure connection (HTTPS). Use your ngrok URL.";
      }

      setScanError(errorMessage);
      gabayToast.error("Camera Error", errorMessage);
    }
  };

  const stopCamera = async () => {
    if (scannerInstance.current?.isScanning) {
      await scannerInstance.current.stop();
      setIsCameraActive(false);
    }
  };

  const handleFileScan = async (file: File) => {
    if (!scannerInstance.current) return;
    setScanError(null);
    setSelectedFileName(file.name);
    setIsVerifying(true);
    
    try {
      const decodedText = await scannerInstance.current.scanFile(file, false);
      onScanSuccess(decodedText);
    } catch (err: any) {
      setScanError("No QR code found in this image.");
      gabayToast.error("Scanning Failed", "We couldn't detect a QR code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileScan(file);
    }
  };

  async function onScanSuccess(decodedText: string) {
    const now = Date.now();
    
    // Check if we are already verifying or if we scanned too recently
    if (isVerifying || (now - lastScanTimestamp.current < SCAN_COOLDOWN)) {
      return;
    }
    
    // Check if the QR is in our format
    if (!decodedText.startsWith("gabay:pickup:")) {
      // Small cooldown even for invalid scans to prevent spamming 'Invalid QR' messages
      if (now - lastScanTimestamp.current > 1000) {
        setScanError("This is not a Resident QR.");
        lastScanTimestamp.current = now;
      }
      return;
    }

    const uid = decodedText.split("gabay:pickup:")[1];
    if (!uid) return;

    // Success! Lock scanner immediately
    lastScanTimestamp.current = now;
    setIsVerifying(true);
    setScanResult(decodedText);
    setScanError(null);
    
    // Stop camera to focus on the result and save battery/CPU
    stopCamera();

    try {
      const token = await auth.currentUser?.getIdToken();
      const userRes = await fetch(`/api/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!userRes.ok) throw new Error("Could not find this person.");
      const userData = await userRes.json();
      setResidentData(userData);

      // Check for their active request
      const request = await getUserActiveRequest(uid);
      setActiveRequest(request);

      if (!request) {
        gabayToast.error("No Task", "This person has no scheduled pickup.");
      }
    } catch (error: any) {
      setScanError(error.message);
      resetScanner();
    } finally {
      setIsVerifying(false);
    }
  }

  function onScanFailure() {
    // Silent failure for every frame that doesn't have a QR
  }

  const resetScanner = () => {
    stopCamera();
    setScanResult(null);
    setResidentData(null);
    setActiveRequest(null);
    setScanError(null);
    setIsVerifying(false);
    setShowRatingModal(false);
    setCriteria({ segregated: false, clean: false, packaged: false });
    setSelectedFileName("No image chosen");
  };

  const handleConfirmCollection = async () => {
    if (!activeRequest || isVerifying) return;
    setIsVerifying(true);
    
    // Calculate final rating score (1 star = 1 point)
    const criteriaCount = Object.values(criteria).filter(Boolean).length;
    // Score mapping to stars: 3 met = 5 stars, 2 met = 4 stars, 1 met = 2 stars, 0 met = 1 star
    const score = criteriaCount === 3 ? 5 : criteriaCount === 2 ? 4 : criteriaCount === 1 ? 2 : 1;
    
    try {
      await updatePickupStatus(activeRequest.id!, 'collected', {
        rating: {
          score,
          criteria
        },
        updatedAt: new Date().toISOString()
      });
      
      gabayToast.success(
        "Pickup Verified", 
        `Collection confirmed! ${score} Eco Points awarded to ${residentData.displayName}.`
      );
      resetScanner();
    } catch (err: any) {
      gabayToast.error("Update Failed", "Could not complete the pickup verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20 animate-in fade-in duration-700">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
        {/* Top Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                Pickups
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Scan resident QR to verify and rate disposal.</p>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Scanner Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-black rounded-[3rem] border-8 border-gray-100 shadow-2xl overflow-hidden relative group aspect-square">
              {isCameraActive ? (
                <>
                  <button 
                    onClick={stopCamera}
                    className="absolute top-6 left-6 z-30 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/10 hover:bg-black/60 transition-all"
                  >
                    Close Camera
                  </button>
                </>
              ) : (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 transition-all ${isDragging ? 'bg-emerald-900/20' : ''}`}
                >
                  <div className="space-y-8 w-full text-center">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white tracking-tight">Request Camera Permissions</h3>
                      <button 
                        onClick={startCamera}
                        className="w-full py-4 bg-white text-black rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        Scan using camera directly
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                      <div className="relative flex justify-center text-xs"><span className="px-2 bg-black text-white/30 font-bold">OR</span></div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white tracking-tight">Scan an Image File</h3>
                      
                      <div className="space-y-3">
                         <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-white/40 text-left px-2">Choose Image - {selectedFileName}</label>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                            >
                              Choose Image
                            </button>
                            <input 
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileScan(file);
                              }}
                            />
                         </div>
                         
                         <div className={`py-6 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'}`}>
                           <p className="text-xs font-bold text-white/40">Or drop an image to scan</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanner Feed Container with Injected Element Styling */}
              <div 
                id="reader" 
                className="w-full h-full bg-black [&_video]:object-cover [&_video]:w-full [&_video]:h-full" 
              />
              
              {isCameraActive && !scanResult && !isVerifying && (
                <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none z-30">
                  <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-2xl">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    Align QR in Center
                  </div>
                </div>
              )}
            </div>

            {scanError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-red-100/80">{scanError}</p>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Box Header */}
              <div className="px-6 py-2 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {residentData ? "Pickups" : "Waiting for Scan"}
                  </h2>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
                  residentData ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-300 border-gray-100"
                }`}>
                  {isVerifying ? <Loader2 className="w-8 h-8 animate-spin" /> : <User className="w-8 h-8" />}
                </div>
              </div>

              {/* Box Content */}
              <div className="flex-1 p-6">
                {residentData ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                    {/* Request Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-bold text-gray-400">Pickup Task</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                       {activeRequest ? (
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                               <p className="text-xs font-bold text-gray-500">Waste Type</p>
                               <div className="flex items-center gap-2">
                                 <Package className="w-4 h-4 text-brand-600" />
                                 <p className="text-sm font-bold text-brand-900">
                                   {WASTE_TYPE_LABELS[activeRequest.wasteType].label}
                                 </p>
                               </div>
                             </div>
                             <span className="px-3 py-1 rounded-lg bg-brand-900 text-white text-xs font-bold capitalize">
                               {activeRequest.status}
                             </span>
                          </div>
                          
                          <div className="p-4 bg-white border border-gray-100 rounded-xl">
                             <p className="text-xs font-bold text-gray-500 mb-1">Notes</p>
                             <p className="text-sm font-semibold text-gray-600 italic">"{activeRequest.notes || 'No notes provided'}"</p>
                          </div>
                          
                          <button 
                            onClick={() => setShowRatingModal(true)}
                            disabled={isVerifying}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-brand-900/20 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            Proceed to Rating
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-12 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-3">
                          <AlertCircle className="w-10 h-10 text-gray-200" />
                          <p className="text-sm font-semibold text-gray-400">No scheduled pickup found for this person.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-400">Scan QR Code</p>
                      <p className="text-xs font-semibold text-gray-300 max-w-[240px] leading-relaxed">
                        Point the camera at the resident's QR to see their info and pickup task.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Box Footer */}
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                {residentData && (
                  <button 
                    onClick={resetScanner}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Waste Rating Modal */}
      {showRatingModal && residentData && activeRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
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
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${
                          star <= (Object.values(criteria).filter(Boolean).length === 3 ? 5 : Object.values(criteria).filter(Boolean).length === 2 ? 4 : Object.values(criteria).filter(Boolean).length === 1 ? 2.5 : 1) 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-200'
                        }`} 
                      />
                    ))}
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
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleConfirmCollection}
                disabled={isVerifying}
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
