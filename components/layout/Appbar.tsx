"use client";

import { User, Menu } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import Link from "next/link";

interface AppbarProps {
  onMenuClick?: () => void;
  title?: string;
  userName?: string;
}

export default function Appbar({ onMenuClick, title = "Dashboard", userName: propUserName }: AppbarProps) {
  const reduxDisplayName = useAppSelector(state => state.auth.displayName);
  const reduxRole = useAppSelector(state => state.auth.role);
  const userName = propUserName || reduxDisplayName || "Admin User";
  
  // Dynamic profile link based on role
  const profileHref = reduxRole ? `/${reduxRole}/profile` : "/admin/profile";
  
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-3 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm shadow-gray-100/50">
      
      {/* Left side: Title and Mobile Toggle */}
      <div className="flex items-center flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden mr-2 p-2 -ml-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all active:scale-90 outline-none"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col min-w-0">
          <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          <span className="text-[10px] md:text-xs font-semibold text-gray-400 capitalize mt-0.5 hidden xs:block">
            EcoTrack Platform
          </span>
        </div>
      </div>

      {/* Right side: Tools & Profile */}
      <div className="flex items-center ml-4">
        
        {/* Divider - Hidden on smallest mobile */}
        <div className="h-6 w-px bg-gray-200 hidden sm:block mx-3"></div>

        {/* User Profile Pill */}
        <Link 
          href={profileHref}
          className="flex items-center group relative p-0.5 md:p-1 md:pr-4 border border-gray-100 rounded-full bg-white hover:bg-gray-50 hover:border-brand-200 transition-all shadow-sm active:scale-95"
        >
          {/* Avatar Circle */}
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center border border-brand-200 text-brand-600 shadow-inner group-hover:rotate-12 transition-transform duration-300">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </div>

          {/* User Info - Hidden on Mobile (except large screens) */}
          <div className="hidden md:flex flex-col ml-3 mr-1">
            <span className="text-sm font-semibold text-gray-800 leading-none group-hover:text-brand-600 transition-colors capitalize truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-[10px] font-medium text-gray-400 capitalize mt-1">
              {reduxRole || "Authority"}
            </span>
          </div>

          {/* Tooltip for desktop only */}
          <div className="absolute top-full mt-3 right-0 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-medium capitalize px-3 py-2 rounded-xl shadow-xl pointer-events-none z-50 hidden md:block">
            Profile settings
          </div>
        </Link>
      </div>

    </header>
  );
}
