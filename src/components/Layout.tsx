"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Ticket, Bell, Search, Menu, User, MessageSquare } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { MovieChatBot } from "./MovieChatBot";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useBooking();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-start md:py-8 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Centered Mobile App Shell */}
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[850px] bg-white flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-x-hidden md:rounded-3xl border border-slate-800">
        
        {/* Movie Chatbot Bottom Drawer */}
        <MovieChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        
        {/* Global Top GNB */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              {/* BRAND LOGO: AirWave style */}
              <span className="font-black text-2xl tracking-tighter text-sky-600 flex items-center">
                Air<span className="text-[#E71A0F]">Wave</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3 text-gray-800">
            {/* Ticket Icon - links to tickets page */}
            <Link 
              href="/ticket" 
              className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                isActive("/ticket") ? "text-[#E71A0F]" : ""
              }`}
              title="모바일 티켓"
            >
              <Ticket className="w-6 h-6 stroke-[1.8]" />
            </Link>
            
            {/* Bell Icon */}
            <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors relative">
              <Bell className="w-6 h-6 stroke-[1.8]" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E71A0F] rounded-full ring-2 ring-white"></span>
            </button>
            
            {/* Search Icon */}
            <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <Search className="w-6 h-6 stroke-[1.8]" />
            </button>

            {/* AI Chatbot Icon */}
            <button 
              onClick={() => setIsChatOpen(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="AI 영화 비서"
            >
              <MessageSquare className="w-6 h-6 stroke-[1.8] text-rose-500 animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-gray-50 pb-20">
          {children}
        </main>

        {/* Global Bottom Tab Navigation */}
        <nav className="fixed bottom-0 md:absolute z-40 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {/* Home Tab */}
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 transition-all ${
              isActive("/") ? "text-gray-900 scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className="w-6 h-6 stroke-[2]" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>

          {/* Central Ticket Booking Tab (Floating Sphere Design) */}
          <div className="-translate-y-5 relative">
            <Link
              href="/booking"
              className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#E71A0F] text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-xs font-black tracking-tighter">예매·예약</span>
            </Link>
          </div>

          {/* More / Mypage Tab */}
          <Link
            href="/mypage"
            className={`flex flex-col items-center space-y-1 transition-all ${
              isActive("/mypage") ? "text-gray-900 scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User className="w-6 h-6 stroke-[2]" />
            <span className="text-[10px] font-bold">더보기</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};
