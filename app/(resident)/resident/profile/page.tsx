"use client";

import { useState, useEffect } from "react";
import { 
  User, Mail, Phone, Lock, Save, MapPin, Loader2, 
  Sparkles, ShieldCheck, Map as MapIcon, ChevronRight,
  Fingerprint, CheckCircle2, Circle, Info, QrCode
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateProfile } from "@/lib/store/slices/authSlice";
import { gabayToast } from "@/lib/toast";
import LocationPicker from "@/components/profile/LocationPicker";
import { QRCodeCanvas } from "qrcode.react";
import { hasActiveRequest } from "@/lib/db/requests";

// @ts-ignore
import { regions, provinces, cities, barangays } from "select-philippines-address";

export default function ResidentProfilePage() {
  const dispatch = useAppDispatch();
  const reduxAuth = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "address" | "security" | "qr">("personal");

  // Address Options State
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    displayName: reduxAuth.displayName || "",
    email: reduxAuth.email || "",
    phone: reduxAuth.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [addressData, setAddressData] = useState({
    region: reduxAuth.address?.region || "",
    province: reduxAuth.address?.province || "",
    city: reduxAuth.address?.city || "",
    barangay: reduxAuth.address?.barangay || "",
    street: reduxAuth.address?.street || "",
    coordinates: {
      lat: reduxAuth.address?.coordinates?.lat || 12.8797,
      lng: reduxAuth.address?.coordinates?.lng || 121.7740
    }
  });

  // Fetch initial data & regions
  useEffect(() => {
    const init = async () => {
      try {
        const regRes = await regions();
        setRegionOptions(regRes);
        
        if (reduxAuth.isAuthenticated && auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({
              ...prev,
              displayName: data.displayName || data.fullName || "",
              email: data.email || "",
              phone: data.phone || "",
            }));
            
            if (data.address) {
              setAddressData(data.address);
              if (data.address.region) {
                const provs = await provinces(data.address.region);
                setProvinceOptions(provs);
              }
              if (data.address.province) {
                const cts = await cities(data.address.province);
                setCityOptions(cts);
              }
              if (data.address.city) {
                const brgys = await barangays(data.address.city);
                setBarangayOptions(brgys);
              }
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [reduxAuth.isAuthenticated]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
        setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const onRegionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setAddressData(prev => ({ ...prev, region: code, province: "", city: "", barangay: "" }));
    setProvinceOptions([]);
    setCityOptions([]);
    setBarangayOptions([]);
    
    const res = await provinces(code);
    if (res.length > 0) {
      setProvinceOptions(res);
    } else {
      const cts = await cities(code);
      setCityOptions(cts);
    }
  };

  const onProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setAddressData(prev => ({ ...prev, province: code, city: "", barangay: "" }));
    setCityOptions([]);
    setBarangayOptions([]);
    const res = await cities(code);
    setCityOptions(res);
  };

  const onCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setAddressData(prev => ({ ...prev, city: code, barangay: "" }));
    setBarangayOptions([]);
    const res = await barangays(code);
    setBarangayOptions(res);
  };

  const onBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAddressData(prev => ({ ...prev, barangay: e.target.value }));
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      gabayToast.error("Error", "Your browser does not support location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddressData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        gabayToast.success("Success", "Location found.");
      },
      (err) => {
        gabayToast.error("Error", "Could not find your location.");
      }
    );
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
          phone: formData.phone,
          address: addressData
        })
      });

      if (!res.ok) throw new Error("Failed update");
      
      const updatedData = await res.json();
      dispatch(updateProfile(updatedData));
      gabayToast.success("Updated", "Profile settings saved.");
    } catch (err: any) {
      gabayToast.error("Error", "Failed to update profile.");
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
      
      gabayToast.success("Success", "Password changed.");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err: any) {
      gabayToast.error("Error", "Could not change password.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#printable-qr canvas") as HTMLCanvasElement;
    if (!canvas) {
      gabayToast.error("Error", "Could not find QR code to download.");
      return;
    }
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `gabay-qr-${formData.displayName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = url;
    link.click();
    gabayToast.success("Downloaded", "QR Code saved as image.");
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
    { id: "personal", label: "Identity", sub: "Personal Info", icon: User },
    { id: "address", label: "Location", sub: "Residence Data", icon: MapPin },
    { id: "qr", label: "QR Badge", sub: "Digital Pickup ID", icon: QrCode },
    { id: "security", label: "Security", sub: "Password & Safety", icon: ShieldCheck },
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
              <p className="text-brand-100/60 text-sm font-medium">Manage your resident profile and security preferences.</p>
            </div>
          </div>

          {/* User Quick Info Bar (Glassmorphism) */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
             <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10 w-full lg:max-w-xl shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                  {formData.displayName.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-black text-white tracking-tight">{formData.displayName}</p>
                  <p className="text-sm font-semibold text-brand-200/60 lowercase">{formData.email}</p>
                </div>
             </div>
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

          {/* Right Side: Form Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Card Header */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-2">
                    {menuItems.find(m => m.id === activeTab)?.label}
                  </h2>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100">
                  {activeTab === "personal" && <User className="w-8 h-8" />}
                  {activeTab === "address" && <MapPin className="w-8 h-8" />}
                  {activeTab === "qr" && <QrCode className="w-8 h-8" />}
                  {activeTab === "security" && <Fingerprint className="w-8 h-8" />}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-8">
                {activeTab === "personal" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                        <input
                          type="text"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                      <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-400">
                        <Mail className="w-4 h-4 mr-3" /> {formData.email}
                      </div>
                    </div>
                  </form>
                )}

                {activeTab === "address" && (
                  <div className="space-y-6">
                    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                      <LocationPicker 
                        lat={addressData.coordinates.lat} 
                        lng={addressData.coordinates.lng} 
                        onLocationSelect={(lat, lng) => setAddressData(prev => ({ ...prev, coordinates: { lat, lng } }))}
                        onAutoDetect={handleAutoDetect}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Region</label>
                            <select 
                                value={addressData.region} 
                                onChange={onRegionChange}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                            >
                            </select>
                        </div>

                        {provinceOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Province</label>
                                <select 
                                    value={addressData.province} 
                                    onChange={onProvinceChange}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                                >
                                    <option value="">Select Province</option>
                                    {provinceOptions.map((p, idx) => <option key={`${p.province_code}-${idx}`} value={p.province_code}>{p.province_name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">City / Municipality</label>
                            <select 
                                value={addressData.city} 
                                onChange={onCityChange}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                            >
                                <option value="">Select City</option>
                                {cityOptions.map((c, idx) => <option key={`${c.city_code}-${idx}`} value={c.city_code}>{c.city_name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Barangay</label>
                            <select 
                                value={addressData.barangay} 
                                onChange={onBarangayChange}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                            >
                                <option value="">Select Barangay</option>
                                {barangayOptions.map((b, idx) => <option key={`${b.brgy_code}-${idx}`} value={b.brgy_code}>{b.brgy_name}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Street / House Number</label>
                            <input 
                                placeholder="Street / House No."
                                value={addressData.street}
                                onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500 shadow-inner"
                            />
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                     <div className="p-6 bg-brand-900 text-brand-50 rounded-2xl shadow-lg relative overflow-hidden group/box">
                        <Lock className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                        <p className="text-sm font-bold leading-relaxed italic relative z-10">
                          "Keep your password unique and at least 8 characters long to ensure your data remains protected."
                        </p>
                      </div>
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Current Password</label>
                            <input 
                                type="password" 
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                placeholder="Enter Current Password"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">New Password</label>
                                <input 
                                    type="password" 
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    placeholder="New Password"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Confirm New</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm New"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:bg-white focus:border-brand-500"
                                />
                            </div>
                        </div>

                        {/* Password Strength */}
                        <div className="mt-4 space-y-3 px-1">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-bold text-gray-400 capitalize">Strength</span>
                                <span className={`text-xs font-bold capitalize ${requirementsMet === 5 ? 'text-emerald-600' : 'text-brand-500'}`}>
                                    {requirementsMet === 0 ? 'Weak' : requirementsMet <= 2 ? 'Fair' : requirementsMet <= 4 ? 'Good' : 'Strong'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                    style={{ width: `${strengthPercent}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-2">
                                {requirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                        <span className={`text-xs font-bold ${req.met ? 'text-gray-700' : 'text-gray-400'}`}>{req.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </div>
                  </form>
                )}

                {activeTab === "qr" && (
                  <div className="flex flex-col items-center justify-center space-y-12 py-12">
                    <style jsx global>{`
                      @media print {
                        body * { visibility: hidden; }
                        #printable-qr, #printable-qr * { visibility: visible; }
                        #printable-qr { 
                          position: fixed; 
                          left: 50%; 
                          top: 50%; 
                          transform: translate(-50%, -50%) scale(1.5);
                        }
                      }
                    `}</style>
                    
                    {/* QR Hero Section */}
                    <div className="relative flex flex-col items-center">
                      {/* Dynamic Background Glow */}
                      <div className="absolute inset-0 bg-brand-500/10 blur-[100px] rounded-full animate-pulse" />
                      
                      <div id="printable-qr" className="relative z-10 p-4 bg-white rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-gray-50 group">
                        <QRCodeCanvas 
                          value={`gabay:pickup:${reduxAuth.uid}`} 
                          size={320} // Large scale
                          level="H"
                          includeMargin={false}
                          className="rounded-[2rem]"
                          imageSettings={{
                            src: "/logo/gabaylogo.png",
                            x: undefined,
                            y: undefined,
                            height: 60,
                            width: 60,
                            excavate: true,
                          }}
                        />
                        
                        {/* Subtle Scan Lines overlay for aesthetics */}
                        <div className="absolute inset-0 pointer-events-none rounded-[3rem] ring-1 ring-inset ring-black/5" />
                      </div>

                      {/* Identity Tag below QR */}
                      <div className="mt-8 text-center space-y-2 relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                          {formData.displayName}
                        </h3>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                      <button 
                        onClick={handleDownloadQR}
                        className="group flex items-center justify-center gap-4 bg-white text-brand-900 border-2 border-brand-900 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-brand-50 active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
                        Download Image
                      </button>
                      
                      <button 
                        onClick={handlePrint}
                        className="group flex items-center justify-center gap-4 bg-gray-900 text-white px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <QrCode className="w-4 h-4 text-brand-400 group-hover:rotate-12 transition-transform" />
                        Print Digital ID
                      </button>
                    </div>
                    
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                      <Info className="w-3 h-3" />
                      Present this to the collector during pickup
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                <button 
                  onClick={activeTab === "security" ? handleUpdatePassword : handleSaveProfile}
                  disabled={loading}
                  className="flex items-center gap-2 bg-brand-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-brand-900/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
