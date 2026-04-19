"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, X, ShieldAlert, CheckCircle2 } from "lucide-react";

export type ModalType = "danger" | "warning" | "info" | "success";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}: ConfirmationModalProps) {
  
  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Configuration for different modal types with Login-inspired aesthetics
  const config = {
    danger: {
      icon: ShieldAlert,
      accentColor: "text-red-400",
      headerBg: "bg-red-950",
      circleBorder: "border-red-900/30",
      btnClass: "bg-red-600 hover:bg-red-700 shadow-red-900/20",
    },
    warning: {
      icon: AlertTriangle,
      accentColor: "text-amber-400",
      headerBg: "bg-amber-950",
      circleBorder: "border-amber-900/30",
      btnClass: "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20",
    },
    info: {
      icon: Info,
      accentColor: "text-brand-400",
      headerBg: "bg-brand-900",
      circleBorder: "border-brand-800/30",
      btnClass: "bg-brand-600 hover:bg-brand-700 shadow-brand-900/20",
    },
    success: {
      icon: CheckCircle2,
      accentColor: "text-emerald-400",
      headerBg: "bg-emerald-950",
      circleBorder: "border-emerald-900/30",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20",
    },
  };

  const currentConfig = config[type];
  const IconComponent = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      
      {/* Premium Blur Backdrop (Matching Login logic) */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Panel - Redesigned with Login Page Aesthetics */}
      <div className="relative bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-500 border border-white/20">
        
        {/* Header: High-Contrast Brand Section (Inspired by Login Page's Left Column) */}
        <div className={`relative h-32 ${currentConfig.headerBg} flex items-center justify-center overflow-hidden`}>
          {/* Subtle geometric circles matching typography logo curves */}
          <div className={`absolute top-[-20%] left-[-10%] w-40 h-40 rounded-full border-[12px] ${currentConfig.circleBorder} z-0`}></div>
          <div className={`absolute bottom-[-20%] right-[-10%] w-32 h-32 rounded-full border-[8px] ${currentConfig.circleBorder} z-0`}></div>
          
          {/* Icon Container */}
          <div className="relative z-10 w-16 h-16 rounded-[1.25rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <IconComponent className={`w-8 h-8 ${currentConfig.accentColor}`} />
          </div>

          {/* Close Button top right (Subtle on dark bg) */}
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all focus:outline-none z-20 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body Section (Inspired by Login Page's Right Column) */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight" id="modal-title">
              {title}
            </h3>
            <div className="text-sm font-semibold text-gray-500 leading-relaxed max-w-[280px]">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="px-8 py-8 space-y-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full flex items-center justify-center py-4 px-6 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group ${currentConfig.btnClass}`}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {confirmText}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 px-6 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-[0.98] border border-gray-100"
          >
            {cancelText}
          </button>
        </div>

        {/* Footer Accent (Subtle line) */}
        <div className="h-1.5 w-full bg-gray-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

      </div>
    </div>
  );
}
