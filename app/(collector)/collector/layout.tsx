"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Truck, 
  Maximize, 
  Settings,
  Bell,
  LayoutDashboard,
  ClipboardList
} from "lucide-react";
import Sidebar, { NavItem } from "@/components/layout/Sidebar";
import Appbar from "@/components/layout/Appbar";

// Define the Collector specific navigation
const collectorNavItems: NavItem[] = [
  { name: "Pickups", href: "/collector/pickups", icon: ClipboardList },
  { name: "Scan", href: "/collector/scan", icon: Maximize },
  { name: "My Profile", href: "/collector/profile", icon: Settings },
];

export default function CollectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine page title from pathname
  const activeItem = collectorNavItems.find(item => pathname === item.href);
  const pageTitle = activeItem ? activeItem.name : "Collector Center";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
      
      <Sidebar 
        items={collectorNavItems} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        brandName="GABAY COLLECTOR"
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <Appbar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={pageTitle}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
