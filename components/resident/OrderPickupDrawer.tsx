"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Truck, 
  MapPin, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileText,
  Trash2,
  ArrowRight
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { gabayToast } from "@/lib/toast";
import { 
  submitPickupRequest, 
  uploadPickupImage,
  PickupRequest 
} from "@/lib/db/requests";

interface OrderPickupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  location: { lat: number, lng: number } | null;
}

export default function OrderPickupDrawer({ isOpen, onClose, onSuccess, location }: OrderPickupDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [wasteType, setWasteType] = useState<PickupRequest['wasteType']>('general');
  const [notes, setNotes] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setWasteType('general');
      setNotes("");
      setExtras([]);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !auth.currentUser || !location) return;
    
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        gabayToast.loading("Uploading...", "Sending evidence photo to Cloud Storage.");
        imageUrl = await uploadPickupImage(auth.currentUser.uid, imageFile);
      }

      await submitPickupRequest({
        residentId: auth.currentUser.uid,
        residentName: auth.currentUser.displayName || "GABAY Resident",
        lat: location.lat,
        lng: location.lng,
        wasteType,
        extras,
        notes,
        imageUrl
      });

      gabayToast.success("Dispatch Sent", "Your pickup order has been issued to the operations center.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      gabayToast.error("Request Failed", err.message || "Could not send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-out border-l border-gray-100 overflow-hidden flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Immersive Header */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white flex-shrink-0 relative">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Truck className="w-6 h-6 text-brand-300" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight leading-none italic">Send Request</h2>
                <p className="text-sm font-semibold text-brand-300 mt-2">Pickup Form</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          
          {/* Location Summary Card */}
          <div className="bg-brand-50/50 rounded-2xl p-6 border border-brand-100 flex items-center gap-5">
             <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <MapPin className="w-6 h-6 text-brand-600" />
             </div>
             <div>
                <h4 className="text-sm font-semibold text-brand-700 mb-1">Location</h4>
                <p className="text-sm font-semibold text-brand-900 tracking-tight">
                  {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                </p>
             </div>
          </div>

          {/* Waste Type Grid */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-400 ml-1">Type of Trash</label>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { id: 'biodegradable', label: 'Biodegradable', sub: 'Organic Waste' },
                    { id: 'recyclable', label: 'Recyclable', sub: 'Reusable Goods' },
                    { id: 'general', label: 'Residual', sub: 'Non-Recyclable' },
                    { id: 'bulk', label: 'Bulk Waste', sub: 'Large items' },
                    { id: 'hazardous', label: 'Hazardous', sub: 'Special Waste' },
                ].map((type) => (
                    <button
                        key={type.id}
                        type="button"
                        onClick={() => setWasteType(type.id as any)}
                        className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col group ${
                            wasteType === type.id 
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                            : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100 hover:bg-white'
                        }`}
                    >
                        <span className="font-semibold text-sm leading-none mb-1.5">{type.label}</span>
                        <span className="text-[10px] font-black uppercase tracking-tight opacity-60 leading-none">{type.sub}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Image Capability */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-400 ml-1">Add Photo (Optional)</label>
            
            {!imagePreview ? (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[16/6] rounded-2xl border-2 border-dashed border-gray-100 hover:border-brand-200 bg-gray-50/30 flex flex-col items-center justify-center transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-600 group-hover:scale-110 transition-all shadow-sm">
                        <Camera className="w-5 h-5" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-400 group-hover:text-brand-700">Take a Photo</p>
                </button>
            ) : (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-gray-100 shadow-xl group">
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Trash Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                            type="button"
                            onClick={removeImage}
                            className="p-4 rounded-2xl bg-red-500 text-white shadow-xl hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-sm font-semibold">Delete Image</span>
                        </button>
                    </div>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
          </div>

          {/* Handling Flags */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-400 ml-1">Extra Info</label>
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'broken-glass', label: 'Broken Glass' },
                    { id: 'heavy', label: 'Heavy Item' },
                    { id: 'needs-help', label: 'Need Extra Help' },
                ].map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                            setExtras(prev => 
                                prev.includes(opt.label) 
                                    ? prev.filter(i => i !== opt.label)
                                    : [...prev, opt.label]
                            );
                        }}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold border transition-all ${
                            extras.includes(opt.label)
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-gray-50 border-transparent text-gray-400'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-400 ml-1">Notes (Optional)</label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Garbage is at the corner of the gate."
                className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-brand-500 min-h-[120px] shadow-inner resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-12 py-5 bg-brand-600 text-white rounded-2xl text-sm font-semibold shadow-2xl shadow-brand-900/40 hover:bg-brand-700 transition-all active:scale-[0.98] flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                </>
            ) : (
                <>
                    Send Now
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
