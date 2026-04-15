"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Truck, 
  Settings,
  MapPin,
  User,
  TicketCheck
} from "lucide-react";
import Sidebar, { NavItem } from "@/components/layout/Sidebar";
import Appbar from "@/components/layout/Appbar";

// Define the Operator specific navigation
const operatorNavItems: NavItem[] = [
  { name: "Pickups", href: "/operator/pickups", icon: Truck },
  { name: "Rewards Management", href: "/operator/rewards", icon: TicketCheck },
  { name: "Collection Points", href: "/operator/collection-points", icon: MapPin },
  { name: "My Profile", href: "/operator/profile", icon: User },
];

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine page title from pathname
  const activeItem = operatorNavItems.find(item => pathname === item.href);
  const pageTitle = activeItem ? activeItem.name : "Operations Center";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
      
      <Sidebar 
        items={operatorNavItems} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        brandName="GABAY OPERATOR"
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
