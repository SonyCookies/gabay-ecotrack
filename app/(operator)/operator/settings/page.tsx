"use client";

import { useState } from "react";
import { 
  Bell, 
  Settings, 
  Save, 
  Loader2, 
  Smartphone, 
  Mail, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { gabayToast } from "@/lib/toast";

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  icon: React.ReactNode;
}

function CustomToggle({ label, description, enabled, onChange, icon }: ToggleProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[1.8rem] hover:shadow-xl hover:shadow-brand-900/5 transition-all group">
      <div className="flex gap-4 items-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${enabled ? 'bg-brand-50 text-brand-600' : 'bg-gray-50 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1.5">{label}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed max-w-xs">{description}</p>
        </div>
      </div>
      
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export default function OperatorSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    systemAlerts: true,
    emailSummaries: true,
    autoAssign: false,
  });

  const handleSave = async () => {
    setLoading(true);
    // Mock save
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    gabayToast.success("Settings Saved", "Your operational preferences have been updated.");
  };

  return (
    <div className="relative -mt-8 sm:-mt-10 -mx-4 sm:-mx-6 lg:-mx-8 pb-12 animate-in fade-in duration-700">
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        
        {/* Header Hero */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-10 md:p-14 overflow-hidden relative group font-sans">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        <Settings className="w-3.5 h-3.5" />
                        System Config
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">Port <span className="text-brand-600">Settings</span></h1>
                    <p className="text-sm font-bold text-gray-400 max-w-sm leading-relaxed uppercase tracking-tight">
                        Configure your management interface and notification orbit.
                    </p>
                </div>
                
                <div className="w-24 h-24 rounded-[2.5rem] bg-brand-900 flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all">
                    <ShieldCheck className="w-10 h-10 text-white" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            <div className="space-y-8">
                <div className="px-2">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Alert Channels</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Manage incoming data alerts</p>
                </div>

                <div className="space-y-4">
                    <CustomToggle 
                        label="System Alerts"
                        description="Receive real-time pulses for new pickup requests and fleet status updates."
                        enabled={settings.systemAlerts}
                        onChange={(val) => setSettings(s => ({ ...s, systemAlerts: val }))}
                        icon={<Smartphone className="w-5 h-5" />}
                    />
                    <CustomToggle 
                        label="Daily Summaries"
                        description="Send a daily performance report to your registered operator email."
                        enabled={settings.emailSummaries}
                        onChange={(val) => setSettings(s => ({ ...s, emailSummaries: val }))}
                        icon={<Mail className="w-5 h-5" />}
                    />
                </div>
            </div>

            <div className="space-y-8">
                <div className="px-2">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Advanced Tools</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Toggle operational automation</p>
                </div>

                <div className="space-y-4">
                    {/* Information Card */}
                    <div className="p-8 bg-brand-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <AlertCircle className="w-16 h-16 text-white" />
                        </div>
                        <div className="relative z-10 space-y-4 mt-6">
                            <h4 className="text-lg font-black text-white leading-tight">Port Resilience</h4>
                            <p className="text-sm font-bold text-brand-300 leading-relaxed uppercase tracking-tight">
                                System configurations are synced across all monitoring nodes in your department's orbit.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-12 py-5 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                                Synchronizing...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4 text-brand-500" />
                                Save Operational Pulse
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
