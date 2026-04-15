"use client";

import { useState, useEffect } from "react";
import { 
  User, Mail, Phone, Lock, Save, Loader2, 
  ShieldCheck, ChevronRight,
  Fingerprint, CheckCircle2, Circle, Briefcase
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateProfile } from "@/lib/store/slices/authSlice";
import { gabayToast } from "@/lib/toast";

export default function CollectorProfilePage() {
  const dispatch = useAppDispatch();
  const reduxAuth = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

  // Form State
  const [formData, setFormData] = useState({
    displayName: reduxAuth.displayName || "",
    email: reduxAuth.email || "",
    phone: reduxAuth.phone || "",
    department: reduxAuth.department || "",
    fleetId: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      if (!reduxAuth.isAuthenticated || !auth.currentUser) return;
      
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          const mappedData = {
            displayName: data.displayName || data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            department: data.department || "",
            fleetId: data.fleetId || "",
          };
          setFormData(prev => ({ ...prev, ...mappedData }));
          
          dispatch(updateProfile({
            displayName: mappedData.displayName,
            phone: mappedData.phone,
            department: mappedData.department
          }));
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    init();
  }, [reduxAuth.isAuthenticated, dispatch]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
        setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          phone: formData.phone
        })
      });

      if (!res.ok) throw new Error("Failed update");
      
      const updatedData = await res.json();
      dispatch(updateProfile({
        displayName: updatedData.displayName || updatedData.fullName,
        phone: updatedData.phone
      }));
      gabayToast.success("Updated", "Your profile details have been saved.");
    } catch (err: any) {
      gabayToast.error("Error", "Could not update your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (formData.newPassword !== formData.confirmPassword) {
      gabayToast.error("Error", "Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, formData.newPassword);
      
      gabayToast.success("Success", "Your password has been changed.");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err: any) {
      gabayToast.error("Error", "Incorrect current password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { label: "8+ characters", met: formData.newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(formData.newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(formData.newPassword) },
    { label: "Number", met: /[0-9]/.test(formData.newPassword) },
    { label: "Special symbol", met: /[^A-Za-z0-9]/.test(formData.newPassword) },
  ];
  const requirementsMet = requirements.filter(req => req.met).length;
  const strengthPercent = (requirementsMet / 5) * 100;

  const menuItems = [
    { id: "personal", label: "Profile", sub: "Your details", icon: User },
    { id: "security", label: "Security", sub: "Safety", icon: ShieldCheck },
  ] as const;

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20">
      {/* Header Hero */}
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
        {/* Header Cluster */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Account Settings
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Update your personal details and password.</p>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
             <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10 w-full lg:max-w-xl shadow-2xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                  {formData.displayName.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-bold text-white tracking-tight">{formData.displayName}</p>
                  <p className="text-sm font-semibold text-brand-200/60 lowercase">{formData.email}</p>
                </div>
             </div>

             {/* Dynamic Badge (Fleet ID) */}
             {formData.fleetId && (
               <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="pr-4">
                     <p className="text-[10px] font-semibold text-brand-100/40 uppercase tracking-widest">Fleet Unit</p>
                     <p className="text-xs font-bold text-white">{formData.fleetId}</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Main Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left Side: Navigation */}
          <div className="lg:col-span-4 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left ${
                    activeTab === item.id 
                      ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
                    activeTab === item.id 
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                      : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                  }`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-black tracking-tight ${activeTab === item.id ? "text-brand-900" : "text-gray-500"}`}>
                      {item.label}
                    </h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === item.id ? "text-brand-600" : "text-gray-400"}`}>
                      {item.sub}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${activeTab === item.id ? "text-brand-500 opacity-100 translate-x-1" : "opacity-0"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Card Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/5 overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Card Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {menuItems.find(m => m.id === activeTab)?.label}
                  </h2>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100">
                  {activeTab === "personal" && <User className="w-8 h-8" />}
                  {activeTab === "security" && <Fingerprint className="w-8 h-8" />}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-8">
                {activeTab === "personal" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Full Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                            placeholder="Full Name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Phone Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                            <Phone className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                            placeholder="+63 000-000-0000"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Account Email</label>
                        <div className="flex items-center p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-400">
                          <Mail className="w-4 h-4 mr-3 text-gray-300" /> {formData.email}
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Department</label>
                         <div className="flex items-center p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-400">
                           <Briefcase className="w-4 h-4 mr-3 text-gray-300" /> {formData.department || "Field Operations"}
                         </div>
                       </div>
                    </div>
                  </form>
                )}

                {activeTab === "security" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                      <div className="space-y-6 max-w-xl">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Current Password</label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                <Lock className="h-5 w-5" />
                              </div>
                              <input 
                                  type="password" 
                                  name="currentPassword"
                                  value={formData.currentPassword}
                                  onChange={handleInputChange}
                                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                  placeholder="Confirm your identity"
                              />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">New Password</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                  </div>
                                  <input 
                                      type="password" 
                                      name="newPassword"
                                      value={formData.newPassword}
                                      onChange={handleInputChange}
                                      className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                      placeholder="New password"
                                  />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 ml-0.5 mb-2">Repeat Password</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                  </div>
                                  <input 
                                      type="password" 
                                      name="confirmPassword"
                                      value={formData.confirmPassword}
                                      onChange={handleInputChange}
                                      className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium text-sm shadow-sm"
                                      placeholder="Repeat new password"
                                  />
                                </div>
                            </div>
                        </div>

                        {/* Password Strength Matrix */}
                        <div className="mt-4 space-y-3 px-1">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] font-bold text-gray-400 capitalize">Password Strength</span>
                                <span className={`text-[10px] font-bold ${requirementsMet === 5 ? 'text-brand-600' : 'text-brand-500'}`}>
                                    {requirementsMet === 0 ? 'Weak' : requirementsMet <= 2 ? 'Fair' : requirementsMet <= 4 ? 'Good' : 'Strong'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)] transition-all duration-300"
                                    style={{ width: `${strengthPercent}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-2">
                                {requirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {req.met ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                                        ) : (
                                          <Circle className="w-3.5 h-3.5 text-gray-300" />
                                        )}
                                        <span className={`text-[10px] font-bold ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>{req.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </div>
                  </form>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                <button 
                  onClick={activeTab === "security" ? handleUpdatePassword : handleSaveProfile}
                  disabled={loading}
                  className="flex items-center gap-2.5 bg-brand-600 text-white px-10 py-4 rounded-xl text-sm font-bold hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save {activeTab === "security" ? "Password" : "Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
