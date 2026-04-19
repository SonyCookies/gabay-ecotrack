"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  User, 
  Phone, 
  ArrowRight,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { gabayToast } from "@/lib/toast";

export default function RegisterPage() {
  const router = useRouter();
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);

  // Phone Formatting Logic from Profile
  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);
    
    let formatted = "+63 ";
    if (digits.length > 0) {
      formatted += digits.substring(0, 4);
    }
    if (digits.length >= 5) {
      formatted += "-" + digits.substring(4, 7);
    }
    if (digits.length >= 8) {
      formatted += "-" + digits.substring(7, 10);
    }
    
    return formatted;
  };

  // Validation Logic
  const passwordRequirements = [
    { label: "8+ characters", met: formData.password.length >= 8 },
    { label: "Uppercase & Lowercase", met: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) },
    { label: "Number or Symbol", met: /[0-9!@#$%^&*]/.test(formData.password) }
  ];
  
  const requirementsMet = passwordRequirements.filter(req => req.met).length;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isFormValid = formData.fullName && isEmailValid && requirementsMet === 3 && passwordsMatch;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "mobileNumber") {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Registration failed");
      }

      gabayToast.success("Welcome!", "Account created successfully. Redirecting to login...");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      gabayToast.error("Registration Failed", err.message || "An error occurred during account creation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans animate-in fade-in duration-700">
      
      {/* Left Column: Brand Hero (Matches Login Page Style) */}
      <div className="hidden lg:flex w-1/2 bg-brand-900 relative flex-col justify-center p-12 overflow-hidden items-center text-center">
        {/* Exact background circles from login page */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full border-[40px] border-brand-800/30 opacity-50 z-0"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[300px] h-[300px] rounded-full border-[30px] border-brand-500/20 opacity-50 z-0"></div>
        
        <div className="relative z-10 text-brand-50 max-w-lg mb-8">
           <Link href="/login" className="inline-flex items-center gap-2 text-brand-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors group mb-12">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Portal Access
          </Link>
          
          <h2 className="text-4xl font-black mb-6 tracking-tight leading-tight">
            Join <br/>
            <span className="text-brand-400">GABAY today.</span>
          </h2>
          <p className="text-brand-100/90 leading-relaxed text-lg font-medium">
             Be part of our community. Schedule easy pickups and earn rewards for recycling.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-white/5 w-full max-w-md">
           <div className="space-y-1">
              <p className="text-3xl font-black text-white tracking-tight">0</p>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Hassle</p>
           </div>
           <div className="space-y-1">
              <p className="text-3xl font-black text-white tracking-tight">Real</p>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">Rewards</p>
           </div>
        </div>
      </div>

      {/* Right Column: Simple Registration Form (Matches Right Login Column) */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-12 md:p-16 bg-gray-50 lg:bg-white relative">
        <div className="w-full max-w-xl lg:max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-xl shadow-gray-200/50 lg:shadow-none lg:p-0 overflow-y-auto max-h-[90vh]">
          
          {/* Header & Logo */}
          <div className="flex justify-center lg:justify-start mb-10 lg:mb-12">
             <Image 
               src="/logo/gabaylogo.svg" 
               alt="GABAY Logo" 
               width={240} 
               height={80} 
               className="w-auto h-16 sm:h-20 object-contain drop-shadow-sm"
               style={{ width: "auto" }}
               priority
             />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">Fill in your details to sign up.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Juan Dela Cruz"
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan@gabay.local"
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Mobile Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="+63 9XX-XXX-XXXX"
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Validation Feedback */}
            <div className="py-2">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Password Rules</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                 {passwordRequirements.map((req, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                     <span className={`text-[10px] font-bold ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>{req.label}</span>
                   </div>
                 ))}
               </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center py-3.5 px-4 text-white font-semibold bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
             <span className="text-gray-500">Already have an account?</span>{" "}
             <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-4">
               Sign In Here
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
