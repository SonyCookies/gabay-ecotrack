"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Settings } from "lucide-react";
import Sidebar, { NavItem } from "@/components/layout/Sidebar";
import Appbar from "@/components/layout/Appbar";

// Define the Admin specific navigation
const adminNavItems: NavItem[] = [
  { name: "Manage Accounts", href: "/admin/accounts", icon: Users },
  { name: "Admin Profile", href: "/admin/profile", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Dynamically determine the title based on the active menu item
  const activeItem = adminNavItems.find(item => pathname === item.href);
  const pageTitle = activeItem ? activeItem.name : "Command Center";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
      
      <Sidebar 
        items={adminNavItems} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        brandName="GABAY ADMIN"
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <Appbar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={pageTitle}
        />
        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
