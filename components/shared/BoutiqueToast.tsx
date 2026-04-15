"use client";

import { CheckCircle2, AlertCircle, Info, X, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

interface BoutiqueToastProps {
  id: string | number;
  message: string;
  description?: string;
  type?: ToastType;
}

export default function BoutiqueToast({ id, message, description, type = "success" }: BoutiqueToastProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600" />,
    loading: <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
  };

  const glows = {
    success: "shadow-emerald-500/20 border-emerald-100",
    error: "shadow-rose-500/20 border-rose-100",
    info: "shadow-blue-500/20 border-blue-100",
    warning: "shadow-amber-500/20 border-amber-100",
    loading: "shadow-brand-500/20 border-brand-100"
  };

  const iconBgs = {
    success: "bg-emerald-50",
    error: "bg-rose-50",
    info: "bg-blue-50",
    warning: "bg-amber-50",
    loading: "bg-brand-50"
  };

  return (
    <div 
      className={`
        relative pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-2xl 
        border bg-white/80 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300
        hover:scale-[1.02] hover:bg-white/90 font-sans
        ${glows[type]}
      `}
      style={{ fontFamily: 'var(--font-sans), sans-serif' }}
    >
      {/* Dynamic Glow Element */}
      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-1 blur-lg opacity-40 rounded-full 
        ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-brand-500'}`} 
      />

      {/* Icon Container */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/50 shadow-sm ${iconBgs[type]}`}>
        {icons[type]}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-bold text-gray-900 tracking-tight leading-tight font-sans">
          {message}
        </p>
        {description && (
          <p className="text-xs font-semibold text-gray-500 leading-relaxed font-sans tracking-tight">
            {description}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => sonnerToast.dismiss(id)}
        className="group relative h-7 w-7 shrink-0 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
      >
        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
      </button>
    </div>
  );
}
