import { Bell, MessageSquare, Truck } from "lucide-react";

export default function CollectorSMSAlertPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center py-16">
        <div className="bg-brand-50 p-5 rounded-full mb-5">
          <MessageSquare className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Collector Notifications</h1>
        <p className="text-gray-500 max-w-lg mb-8 text-sm md:text-base">
          Get real-time instant alerts for new assignments, route changes, and urgent messages directly to your mobile.
        </p>

        <div className="w-full max-w-md bg-gray-50 rounded-xl p-6 border border-gray-100 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-gray-800">Route Assignment Alerts</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>
          <p className="text-xs text-gray-400">
            When toggled on, we'll SMS you a quick summary of any urgent additions to your active shift.
          </p>
        </div>
      </div>
    </div>
  );
}
