import { toast as sonnerToast } from "sonner";
import BoutiqueToast from "@/components/shared/BoutiqueToast";
import React from "react";

/**
 * GABAY Boutique Toast Utility
 * A premium wrapper around sonner that injects custom-designed 
 * glassmorphic alerts with sophisticated brand-aligned glows.
 */
export const gabayToast = {
  success: (message: string, description?: string) => {
    sonnerToast.custom((t) => (
      React.createElement(BoutiqueToast, {
        id: t,
        message,
        description,
        type: "success"
      })
    ));
  },
  error: (message: string, description?: string) => {
    sonnerToast.custom((t) => (
      React.createElement(BoutiqueToast, {
        id: t,
        message,
        description,
        type: "error"
      })
    ));
  },
  info: (message: string, description?: string) => {
    sonnerToast.custom((t) => (
      React.createElement(BoutiqueToast, {
        id: t,
        message,
        description,
        type: "info"
      })
    ));
  },
  warning: (message: string, description?: string) => {
    sonnerToast.custom((t) => (
      React.createElement(BoutiqueToast, {
        id: t,
        message,
        description,
        type: "warning"
      })
    ));
  },
  loading: (message: string, description?: string) => {
    sonnerToast.custom((t) => (
      React.createElement(BoutiqueToast, {
        id: t,
        message,
        description,
        type: "loading"
      })
    ));
  },
  // Keep standard sonner promise support
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
