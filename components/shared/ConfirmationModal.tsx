"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, X, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

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

  // Configuration for different modal types
  const config = {
    danger: {
      icon: ShieldAlert,
      iconBg: "bg-red-50 text-red-600 border-red-100",
      btnClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500/20 shadow-red-500/20 text-white",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-orange-50 text-orange-600 border-orange-100",
      btnClass: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/20 shadow-orange-500/20 text-white",
    },
    info: {
      icon: Info,
      iconBg: "bg-brand-50 text-brand-600 border-brand-100",
      btnClass: "bg-brand-600 hover:bg-brand-700 focus:ring-brand-500/20 shadow-brand-500/20 text-white",
    },
    success: {
      icon: CheckCircle2,
      iconBg: "bg-green-50 text-green-600 border-green-100",
      btnClass: "bg-green-600 hover:bg-green-700 focus:ring-green-500/20 shadow-green-500/20 text-white",
    },
  };

  const currentConfig = config[type];
  const IconComponent = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Close Button top right */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            
            {/* Thematic Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-sm mb-5 ${currentConfig.iconBg}`}>
              <IconComponent className="w-7 h-7" />
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-2" id="modal-title">
              {title}
            </h3>
            <div className="text-sm font-medium text-gray-500 leading-relaxed">
              {message}
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 border-t border-gray-100 gap-3 gap-y-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full inline-flex justify-center rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed ${currentConfig.btnClass}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              confirmText
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-colors sm:w-auto hover:text-gray-900"
          >
            {cancelText}
          </button>
        </div>

      </div>
    </div>
  );
}
