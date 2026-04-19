"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon, X, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toggleSidebar } from "@/lib/store/slices/uiSlice";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
}

export default function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);
  const isCollapsed = useAppSelector((state) => state.ui.isSidebarCollapsed);
  
  // Dynamic logo link path based on role
  let dashboardPath = "/login";
  if (role === "admin") dashboardPath = "/admin/accounts";
  else if (role === "operator") dashboardPath = "/operator/pickups";
  else if (role === "collector") dashboardPath = "/collector/pickups";
  else if (role) dashboardPath = `/${role}/dashboard`;
  
  // States
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error", error);
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[60] bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out md:translate-x-0 md:static flex flex-col shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[88px]" : "w-[280px]"}`}
      >
        <div className={`flex items-center border-b border-gray-100 flex-shrink-0 min-h-[88px] relative ${isCollapsed ? "px-0 justify-center" : "px-6 justify-between"}`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-gray-900 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {!isCollapsed && (
            <Link href={dashboardPath} className="flex items-center select-none group">
              <Image 
                src="/logo/gabaylogo.svg" 
                alt="GABAY EcoTrack Logo" 
                width={170} 
                height={48} 
                className="w-auto h-12 object-contain group-hover:-translate-y-0.5 transition-transform"
                style={{ width: "auto" }}
                priority
              />
            </Link>
          )}

          <button
            onClick={() => dispatch(toggleSidebar())}
            className={`p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all focus:outline-none hidden md:flex items-center justify-center border border-transparent hover:border-gray-100 shadow-sm active:scale-95 ${
              isCollapsed ? "bg-brand-50 text-brand-600 border-brand-100" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="w-6 h-6" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Wrapper (Removed overflow so tooltips don't clip) */}
        <nav className={`space-y-1.5 flex flex-col flex-1 mt-2 mb-2 ${isCollapsed ? "px-3" : "px-4"}`}>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? "justify-center px-4 py-4" : "px-4 py-3.5"} rounded-xl transition-all font-semibold text-sm ${
                    isActive
                      ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <item.icon 
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-brand-600" : "text-gray-400 group-hover:text-brand-500"} ${!isCollapsed && "mr-3"}`} 
                  />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
                
                {/* Clean SaaS Hover Tooltip (Only shows when collapsed) */}
                {isCollapsed && (
                  <div className="absolute left-[110%] top-0 h-full ml-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 text-gray-800 text-sm font-bold px-5 rounded-xl shadow-xl shadow-gray-200/50 pointer-events-none z-50 flex items-center justify-center">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <div className="border-t border-gray-100 bg-gray-50/50 flex-shrink-0 p-4 transition-all duration-300">
          <div className="relative group">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className={`w-full flex items-center ${isCollapsed ? "justify-center py-4" : "px-4 py-3.5"} rounded-xl transition-all font-semibold text-sm capitalize text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100/50 shadow-sm`}
            >
              <LogOut className={`w-5 h-5 flex-shrink-0 ${!isCollapsed && "mr-3"}`} />
              {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-[110%] top-0 h-full ml-2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 text-red-600 text-sm font-bold px-5 rounded-xl shadow-xl shadow-gray-200/50 pointer-events-none z-50 flex items-center justify-center">
                Sign Out
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Global Confirmation Modals handled by Sidebar logic */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleSignOut}
        type="danger"
        title="Disconnect Session"
        message="Are you sure you want to securely sign out of the GABAY EcoTrack Platform? You will need to re-authenticate with your credentials to access the system again."
        confirmText="Sign Out Securely"
        cancelText="Cancel"
        isLoading={isLoggingOut}
      />
    </>
  );
}
