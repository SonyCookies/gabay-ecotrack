"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Mail, MessageSquare, Smartphone, 
  Clock, Save, Loader2, ShieldCheck,
  RotateCw, ChevronRight,
  Settings2, User, Activity, Fingerprint,
  Lock, Key
} from "lucide-react";
import { auth, getMessagingObject } from "@/lib/firebase/client";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateProfile } from "@/lib/store/slices/authSlice";
import { gabayToast } from "@/lib/toast";
import { requestNotificationPermission, onMessageListener } from "@/lib/messaging/push";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  icon: React.ReactNode;
  active?: boolean;
}

function CustomToggle({ label, description, enabled, onChange, icon }: ToggleProps) {
  return (
    <button
        onClick={() => onChange(!enabled)}
        className={`group relative flex items-center p-4 rounded-2xl border transition-all text-left w-full ${
            enabled 
                ? "bg-white border-brand-600 shadow-xl shadow-brand-900/20 scale-[1.02] z-10" 
                : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
        }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
            enabled 
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
        }`}>
            {icon}
        </div>
        <div className="flex-1">
            <h4 className={`text-sm font-black tracking-tight ${enabled ? "text-brand-900" : "text-gray-500"}`}>
                {label}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${enabled ? "text-brand-600" : "text-gray-400"}`}>
                    {description}
                </p>
                {enabled && <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />}
            </div>
        </div>
        <ChevronRight className={`w-4 h-4 transition-all ${enabled ? "text-brand-500 opacity-100 translate-x-1" : "opacity-0"}`} />
    </button>
  );
}

export default function ResidentSettingsPage() {
  const dispatch = useAppDispatch();
  const reduxAuth = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPushSupported, setIsPushSupported] = useState(true);
  const [activeTab, setActiveTab] = useState<"notifications" | "security" | "account" | "support">("notifications");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
  };

  const [settings, setSettings] = useState({
    push: reduxAuth.notifications?.push ?? true,
    sms: reduxAuth.notifications?.sms ?? false,
    email: reduxAuth.notifications?.email ?? true,
    nightBefore: reduxAuth.notifications?.nightBefore ?? true,
  });

  useEffect(() => {
    if (reduxAuth.notifications) setSettings(reduxAuth.notifications);
    setInitialLoading(false);
    
    getMessagingObject().then(m => { if (!m) setIsPushSupported(false); });

    onMessageListener().then((payload: any) => {
      if (payload?.notification) {
          gabayToast.success(
            payload.notification.title || "New Alert", 
            payload.notification.body || "You have a new community update."
          );

          if (Notification.permission === 'granted') {
             new Notification(payload.notification.title || "GABAY Alert", {
                body: payload.notification.body || "",
                icon: '/logo/gabaylogo.png'
             });
          }
      }
    });
  }, [reduxAuth.notifications]);

  const handlePushToggle = async (val: boolean) => {
    setSettings(s => ({ ...s, push: val }));
    if (val) {
      const token = await requestNotificationPermission();
      if (token) {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${idToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ fcmToken: token })
          });
          gabayToast.success("Device Registered", "Push notifications are now active.");
        }
      } else {
        setSettings(s => ({ ...s, push: false }));
        gabayToast.error("Permission Denied", "Check your browser settings.");
      }
    }
  };


  const handleSaveSettings = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: settings })
      });
      const updatedData = await res.json();
      dispatch(updateProfile(updatedData));
      gabayToast.success("Preferences Saved", "Synchronization complete.");
    } catch (err) {
      gabayToast.error("Error", "Could not save your preferences.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <RotateCw className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-[10px] font-semibold text-gray-400">Synchronizing Orbits...</p>
      </div>
    );
  }

  const menuItems = [
    { id: "notifications", label: "Notifications", sub: "Alert Orbits", icon: Bell },
    { id: "security", label: "Security Protocol", sub: "Safety Identity", icon: ShieldCheck },
    { id: "account", label: "Identity Profile", sub: "Account Origin", icon: User },
    { id: "support", label: "System Pulse", sub: "Diagnostics Hub", icon: Activity },
  ] as const;

  const displayedMenuItems = menuItems.filter(item => {
    if (!appliedSearch) return true;
    const query = appliedSearch.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.sub.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-20">
      <div className="absolute top-0 left-0 right-0 h-80 sm:h-64 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 z-0" />
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-6 mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Management Center
              </h1>
              <p className="text-brand-100/60 text-sm font-medium">Configure your community communication orbits.</p>
            </div>
          </div>

          {/* Search Bar - Standardized Style */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative group w-full lg:max-w-md">
                <input
                    type="text"
                    placeholder="Search settings (e.g. 'sms', 'reset')..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-5 pr-24 text-sm font-semibold focus:border-white/20 focus:ring-4 focus:ring-white/5 outline-none text-white transition-all shadow-sm placeholder:text-white/40"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                    <button type="submit" className="h-full px-5 bg-white text-brand-900 rounded-lg text-sm font-semibold capitalize transition-all active:scale-95 shadow-lg">
                        Search
                    </button>
                </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          
          {/* Left Side: Tactical Navigation */}
          <div className="lg:col-span-4 space-y-3">
             <div className="grid grid-cols-1 gap-3">
                {displayedMenuItems.map((item) => (
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

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-brand-900/10 overflow-hidden flex flex-col min-h-[600px]">
              
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {menuItems.find(m => m.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm font-bold text-gray-400 leading-none">
                    {activeTab === 'notifications' ? 'Validate and save your communication preferences.' : 'Module functionality restricted to read-only mode.'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100">
                  {activeTab === "notifications" && <Bell className="w-8 h-8" />}
                  {activeTab === "security" && <Fingerprint className="w-8 h-8" />}
                  {activeTab === "account" && <User className="w-8 h-8" />}
                  {activeTab === "support" && <Activity className="w-8 h-8" />}
                </div>
              </div>

              <div className="flex-1 p-8">
                {activeTab === "notifications" && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomToggle 
                            label={isPushSupported ? "Browser Alerts" : "Not Supported"}
                            description="Instant push notifications"
                            enabled={isPushSupported && settings.push}
                            onChange={isPushSupported ? handlePushToggle : () => {}}
                            icon={<Smartphone className="w-5 h-5" />}
                        />
                        <CustomToggle 
                            label="SMS Messages"
                            description="Direct text alerts"
                            enabled={settings.sms}
                            onChange={(val) => setSettings(s => ({ ...s, sms: val }))}
                            icon={<MessageSquare className="w-5 h-5" />}
                        />
                        <CustomToggle 
                            label="Email Reports"
                            description="Weekly summaries & news"
                            enabled={settings.email}
                            onChange={(val) => setSettings(s => ({ ...s, email: val }))}
                            icon={<Mail className="w-5 h-5" />}
                        />
                        <CustomToggle 
                            label="Night-Before"
                            description="Smart collection reminders"
                            enabled={settings.nightBefore}
                            onChange={(val) => setSettings(s => ({ ...s, nightBefore: val }))}
                            icon={<Clock className="w-5 h-5" />}
                        />
                      </div>

                      <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <Save className="w-4 h-4 text-brand-500" />}
                        Save System Preferences
                      </button>
                  </div>
                )}


                {activeTab === "security" && (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="relative">
                            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                                <ShieldCheck className="w-16 h-16" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-brand-500 p-3 rounded-2xl text-white shadow-xl">
                                <Lock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Security Perimeter</h3>
                            <p className="text-sm font-bold text-gray-400 max-w-xs leading-relaxed uppercase tracking-widest">
                                Advanced identity protection and biometric protocols are coming soon to GABAY.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">MFA (SOON)</div>
                            <div className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">LOGS</div>
                        </div>
                    </div>
                )}

                {activeTab === "account" && (
                     <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                            <User className="w-16 h-16" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Account Origin</h3>
                            <p className="text-sm font-bold text-gray-400 max-w-xs leading-relaxed uppercase tracking-widest">
                                Manage your primary contact methods and resident credentials.
                            </p>
                        </div>
                        <button className="px-8 py-3 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-100">
                            Verify Identity
                        </button>
                    </div>
                )}

                {activeTab === "support" && (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                            <Activity className="w-16 h-16" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">System Pulse</h3>
                            <p className="text-sm font-bold text-gray-400 max-w-xs leading-relaxed uppercase tracking-widest">
                                Monitoring real-time connection bridges and community cluster health.
                            </p>
                        </div>
                        <div className="w-full max-w-sm p-4 bg-gray-900 rounded-2xl text-[8px] font-mono text-brand-400 text-left overflow-hidden">
                             <p className="opacity-50"># gabay-system-logs --tail 5</p>
                             <p className="mt-1">{">"} ORBITAL_PING_SUCCESS (2ms)</p>
                             <p>{">"} CACHE_WAKELOCK_RETAINED</p>
                             <p>{">"} ASSET_PIPELINE_STABLE</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
