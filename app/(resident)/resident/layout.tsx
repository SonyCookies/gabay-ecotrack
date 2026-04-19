"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  Leaf, 
  Settings,
  Bell,
  Truck,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Scan,
} from "lucide-react";
import Sidebar, { NavItem } from "@/components/layout/Sidebar";
import Appbar from "@/components/layout/Appbar";

// Define the Resident specific navigation
const residentNavItems: NavItem[] = [
  { name: "My Dashboard", href: "/resident/dashboard", icon: LayoutDashboard },
  { name: "Request Pickup", href: "/resident/pickup-request", icon: Truck },
  { name: "Waste Scanner", href: "/resident/scanner", icon: Scan },
  { name: "Eco Points", href: "/resident/eco-points", icon: Sparkles },
  { name: "Waste Guidance", href: "/resident/guidance", icon: BookOpen },
  { name: "My Profile", href: "/resident/profile", icon: ShieldCheck },
];

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine page title from pathname
  const activeItem = residentNavItems.find(item => pathname === item.href);
  const pageTitle = activeItem ? activeItem.name : "Community Hub";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
      
      <Sidebar 
        items={residentNavItems} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        brandName="GABAY RESIDENT"
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
