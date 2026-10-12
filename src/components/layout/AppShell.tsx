"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import {
  CalendarDays,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Clock,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Resources", href: "/resources", icon: Layers },
    { label: "Book a Resource", href: "/book", icon: PlusCircle, highlight: true },
    { label: "My Bookings", href: "/reservations", icon: Clock },
    ...(isAdmin ? [{ label: "Admin Manager", href: "/admin/reservations", icon: Shield, admin: true }] : []),
    { label: "Settings", href: "/profile", icon: User },
  ];

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">PrimeWave Lab</span>
              <span className="ml-1 text-[10px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                RMS
              </span>
            </div>
          </Link>
          <div className="text-xs text-slate-500">Resource Reservation Management System</div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">{children}</main>
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          © 2026 PrimeWave Lab (Pvt) Ltd • Technical Assessment Deliverable
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              PrimeWave RMS
            </div>
            <div className="text-[10px] text-teal-400 font-medium">Enterprise Booking</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold"
                    : item.highlight
                    ? "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                    : item.admin
                    ? "text-purple-300 hover:bg-purple-950/40 hover:text-purple-200"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : item.highlight ? "text-teal-400" : item.admin ? "text-purple-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span className="flex-1">{item.label}</span>
                {item.highlight && !active && (
                  <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                )}
                {item.admin && !active && (
                  <span className="text-[9px] font-bold uppercase bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-purple-400" : "bg-teal-400"}`} />
                    {isAdmin ? "Admin Manager" : "Staff Member"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block w-full py-2 text-center text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">PrimeWave Lab</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{pathname.replace("/", "") || "Dashboard"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational • UTC+05:30</span>
            </div>

            {user ? (
              <Link
                href="/book"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Book Now
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 text-slate-300"
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>

        <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 PrimeWave Lab (Pvt) Ltd. All rights reserved.</span>
          <span className="text-slate-400 font-medium">Resource Reservation System • Full-Stack Assessment</span>
        </footer>
      </div>
    </div>
  );
}
