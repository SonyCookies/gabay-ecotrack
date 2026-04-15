"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, Phone, Lock, Shield, Briefcase, Truck, RefreshCw, Loader2, Save } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { ROLES, UserRole } from "@/lib/roles";
import { gabayToast } from "@/lib/toast";

interface Account {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  fleetId?: string;
}

interface CreateAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  account?: Account | null; // Account to edit
}

export default function CreateAccountDrawer({ isOpen, onClose, onSuccess, account }: CreateAccountDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: ROLES.OPERATOR as UserRole,
    department: "",
    fleetId: "",
  });

  const isEditMode = !!account;

  // Sync form data when account prop changes (for Edit mode)
  useEffect(() => {
    if (account) {
      setFormData({
        fullName: account.fullName || "",
        email: account.email || "",
        password: "", // Keep password empty for security/optionality
        phone: account.phone || "",
        role: account.role || ROLES.OPERATOR,
        department: account.department || "",
        fleetId: account.fleetId || "",
      });
    } else {
      // Reset for creation mode
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        role: ROLES.OPERATOR as UserRole,
        department: "",
        fleetId: "",
      });
    }
  }, [account, isOpen]);

  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("63")) digits = digits.slice(2);
    digits = digits.slice(0, 10);
    
    let formatted = "+63 ";
    if (digits.length > 0) formatted += digits.substring(0, 4);
    if (digits.length >= 5) formatted += "-" + digits.substring(4, 7);
    if (digits.length >= 8) formatted += "-" + digits.substring(7, 10);
    
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required");
      
      const token = await user.getIdToken();
      
      if (isEditMode && account) {
        // UPDATE FLOW
        const res = await fetch(`/api/users/${account.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: formData.phone,
            role: formData.role,
            department: formData.role === ROLES.OPERATOR ? formData.department : undefined,
            fleetId: formData.role === ROLES.COLLECTOR ? formData.fleetId : undefined,
            // Logic for password update could be added here if needed (e.g. via separate API or Firebase Admin)
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update account");
        }

        gabayToast.success("Updated", `${formData.fullName} has been modified successfully.`);
      } else {
        // CREATE FLOW
        const res = await fetch("/api/auth/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            role: formData.role,
            profileData: {
              phone: formData.phone,
              department: formData.role === ROLES.OPERATOR ? formData.department : undefined,
              fleetId: formData.role === ROLES.COLLECTOR ? formData.fleetId : undefined,
            }
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create account");
        }

        gabayToast.success("Success", `${formData.fullName} has been registered.`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      gabayToast.error("Error", err.message);
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
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 to-brand-800 p-8 text-white flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <UserPlus className="w-5 h-5 text-brand-300" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{isEditMode ? "Edit account" : "New account"}</h2>
                <p className="text-[10px] font-bold text-brand-300 tracking-tight mt-0.5">
                  {isEditMode ? `ID: ${account.id.slice(-8)}` : "Register a new user to the system"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-gray-50/30">
          
          {/* Role Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Account type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: ROLES.OPERATOR }))}
                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all gap-3 ${
                  formData.role === ROLES.OPERATOR 
                  ? 'border-brand-500 bg-white text-brand-700 shadow-md shadow-brand-500/5' 
                  : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                <Shield className={`w-4 h-4 ${formData.role === ROLES.OPERATOR ? 'text-brand-600' : 'text-gray-300'}`} />
                <span className="font-bold text-sm tracking-tight leading-none">Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: ROLES.COLLECTOR }))}
                className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all gap-3 ${
                  formData.role === ROLES.COLLECTOR 
                  ? 'border-brand-500 bg-white text-brand-700 shadow-md shadow-brand-500/5' 
                  : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                <Truck className={`w-4 h-4 ${formData.role === ROLES.COLLECTOR ? 'text-brand-600' : 'text-gray-300'}`} />
                <span className="font-bold text-sm tracking-tight leading-none">Collector</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Full name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                  <Save className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium shadow-sm"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isEditMode}
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl outline-none font-medium transition-all shadow-sm ${
                    isEditMode ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500'
                  }`}
                  placeholder="name@gabay.gov"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Phone number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium shadow-sm"
                  placeholder="+63 9XX-XXX-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">
                {formData.role === ROLES.OPERATOR ? 'Department' : 'Fleet unit'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name={formData.role === ROLES.OPERATOR ? "department" : "fleetId"}
                  value={formData.role === ROLES.OPERATOR ? formData.department : formData.fleetId}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium shadow-sm"
                  placeholder={formData.role === ROLES.OPERATOR ? "e.g. Field Ops" : "e.g. Area 7"}
                />
              </div>
            </div>
          </div>

          {!isEditMode && (
            <div className="pt-6 border-t border-gray-100 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Initial password</label>
                <div className="flex gap-4">
                  <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="password"
                      required={!isEditMode}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-mono font-bold shadow-sm"
                      placeholder="Password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="flex items-center justify-center w-14 rounded-xl bg-white border border-gray-300 text-gray-500 transition-all active:scale-95 shadow-sm hover:border-brand-500 hover:text-brand-600"
                    title="Generate security code"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[11px] font-medium text-gray-400 ml-1">Staff will be asked to change this after login.</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="p-8 border-t border-gray-100 bg-white flex-shrink-0 flex items-center justify-end gap-4 shadow-[0_-4px_20px_0_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white text-gray-400 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 hover:text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center h-12 px-10 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg border border-gray-100 disabled:opacity-50 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wait...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2.5 group-hover:scale-110 transition-transform" />
                {isEditMode ? "Save changes" : "Create account"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
