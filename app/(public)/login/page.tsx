"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Mail, LogIn, Lock, ShieldAlert } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAppDispatch } from "@/lib/store/hooks";
import { setUserLoggedIn, setAuthInitializing } from "@/lib/store/slices/authSlice";
import { gabayToast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("admin@gabay.local");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Unable to fetch user role.");
      const userData = await res.json();

      // Sync Firebase user up to global Redux store with FULL metadata
      dispatch(setUserLoggedIn({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData.role,
        displayName: userData.displayName || userData.fullName,
        phone: userData.phone,
        department: userData.department
      }));

      if (userData.role === "admin") router.push("/admin/accounts");
      else if (userData.role === "operator") router.push("/operator/pickups");
      else if (userData.role === "collector") router.push("/collector/pickups");
      else router.push("/resident/dashboard");
      
    } catch (err: any) {
      console.error(err);
      gabayToast.error("Login Failed", "Invalid credentials or server error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* Left Column: Brand/Image Section */}
      <div className="hidden lg:flex w-1/2 bg-brand-900 relative flex-col justify-center p-12 overflow-hidden items-center text-center">
        {/* Subtle geometric circles matching typography logo curves */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full border-[40px] border-brand-800/30 opacity-50 z-0"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[300px] h-[300px] rounded-full border-[30px] border-brand-500/20 opacity-50 z-0"></div>
        
        <div className="relative z-10 text-brand-50 max-w-lg mb-8">
          <h2 className="text-4xl font-black mb-6 tracking-tight leading-tight">Logistics driving <br/><span className="text-brand-400">sustainability.</span></h2>
          <p className="text-brand-100/90 leading-relaxed text-lg font-medium">
            A comprehensive, digital solid waste management architecture empowering LGUs to streamline collections and connect seamlessly with their residents.
          </p>
        </div>
      </div>

      {/* Right Column: Corporate Clean Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-12 md:p-16 bg-gray-50 lg:bg-white relative">
        <div className="w-full max-w-xl lg:max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-xl shadow-gray-200/50 lg:shadow-none lg:p-0">
          
          {/* Official Actual SVG Logo Header */}
          <div className="flex justify-center lg:justify-start mb-10 lg:mb-12">
             <Image 
               src="/logo/gabaylogo.svg" 
               alt="GABAY EcoTrack Logo" 
               width={240} 
               height={80} 
               className="w-auto h-16 sm:h-20 object-contain drop-shadow-sm" 
               style={{ width: "auto" }}
               priority
             />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">Log in to your dashboard to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
                  placeholder="name@gabay.local"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium tracking-wide"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-3.5 px-4 text-white font-semibold bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-gray-500">New around here?</span>{" "}
            <a href="/register" className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-4">
              Create a resident account
            </a>
          </div>
          
        </div>
      </div>
    </div>
  );
}
