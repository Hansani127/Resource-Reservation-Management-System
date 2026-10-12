"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { DashboardStats } from "@/types";
import {
  Layers,
  CheckCircle,
  CalendarCheck,
  Clock,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Building,
  Car,
  Tv,
  Briefcase,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          throw new Error("Failed to load dashboard metrics");
        }
        const data = await res.json();
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading metrics");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadStats();
    }
  }, [authLoading, user]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Meeting Room":
        return <Building className="w-4 h-4 text-sky-600" />;
      case "Vehicle":
        return <Car className="w-4 h-4 text-emerald-600" />;
      case "Equipment":
        return <Tv className="w-4 h-4 text-amber-600" />;
      default:
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Authentication Required</h2>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          Please sign in to access the PrimeWave Lab Resource Reservation System.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700"
        >
          Sign In Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider bg-teal-900/50 text-teal-200 px-2.5 py-1 rounded-full border border-teal-600/40">
                PrimeWave Lab Operations Hub
              </span>
              {isAdmin && (
                <span className="text-xs uppercase font-semibold tracking-wider bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-full border border-purple-400/30">
                  Administrator Access
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Centralized coordination for meeting rooms, audio/visual gear, company vehicles, and collaborative workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/book"
              className="px-5 py-2.5 rounded-xl bg-white text-teal-900 font-semibold text-sm shadow-sm hover:bg-teal-50 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              Book a Resource
            </Link>
            <Link
              href="/resources"
              className="px-4 py-2.5 rounded-xl bg-teal-900/40 hover:bg-teal-900/60 text-white text-sm font-medium border border-teal-500/30 transition flex items-center gap-2"
            >
              Browse Facilities
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Resources
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.totalResources ?? 0}
            </h3>
            <span className="text-xs text-slate-500 mt-0.5 block">Shared facilities</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Active Resources */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Active & Available
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.activeResources ?? 0}
            </h3>
            <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
              Ready for reservation
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Reservations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Bookings
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.todayReservationsCount ?? 0}
            </h3>
            <span className="text-xs text-slate-500 mt-0.5 block">Active reservations</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Bookings
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.upcomingReservationsCount ?? 0}
            </h3>
            <span className="text-xs text-slate-500 mt-0.5 block">Future scheduled slots</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Reservation Activity</h2>
              <p className="text-xs text-slate-500">Latest reservations coordinated across all teams</p>
            </div>
            <Link
              href="/reservations"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View My Bookings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading activity...</div>
            ) : !stats?.recentReservations || stats.recentReservations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No recent reservations recorded.
              </div>
            ) : (
              stats.recentReservations.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/70 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.resource?.category || "")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-teal-700">{item.resource?.name}</span>
                        <span>•</span>
                        <span>By {item.user?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-slate-700">
                      {new Date(item.startAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(item.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(item.endAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        item.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Launch & Resource Categories */}
        <div className="space-y-6">
          {/* Quick Booking Callout */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Conflict-Free Scheduling
              </span>
              <h3 className="text-lg font-bold mt-1 mb-2">Ready to Book?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Check live room availability, pick any open 30-minute interval, and guarantee your booking without overlaps.
              </p>
            </div>
            <Link
              href="/book"
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs tracking-wide uppercase text-center transition flex items-center justify-center gap-1.5"
            >
              Start New Reservation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* System Rules Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Reservation Policies</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span>Overlapping bookings are automatically blocked at both application and database engine layers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span>Contiguous back-to-back bookings (e.g. 10:00–11:00 & 11:00–12:00) are fully permitted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span>Cancelling a reservation immediately re-opens the slot for colleagues.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
