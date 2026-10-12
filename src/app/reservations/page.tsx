"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { ReservationItem } from "@/types";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  X,
  Filter,
} from "lucide-react";

export default function ReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  // Cancellation modal state
  const [cancellingItem, setCancellingItem] = useState<ReservationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reservations?scope=my");
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error("Failed to fetch reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchReservations();
    }
  }, [authLoading, user]);

  const filteredReservations = useMemo(() => {
    const now = new Date();
    return reservations.filter((r) => {
      const end = new Date(r.endAt);
      if (activeTab === "cancelled") {
        return r.status === "CANCELLED";
      }
      if (r.status === "CANCELLED") return false;

      if (activeTab === "upcoming") {
        return end >= now;
      }
      if (activeTab === "past") {
        return end < now;
      }
      return true;
    });
  }, [reservations, activeTab]);

  const handleConfirmCancel = async () => {
    if (!cancellingItem) return;
    setCancelling(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/reservations/${cancellingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel reservation");
      }

      setActionMessage("Reservation successfully cancelled. The time slot is now open for new bookings.");
      setCancellingItem(null);
      fetchReservations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
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
        <h2 className="text-xl font-bold text-slate-800">Please Sign In First</h2>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          Log in to inspect and coordinate your bookings.
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-teal-600" />
            My Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, inspect, and manage your scheduled facilities and equipment bookings.
          </p>
        </div>

        <Link
          href="/book"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          New Reservation
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "upcoming"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming Bookings
        </button>

        <button
          onClick={() => setActiveTab("past")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "past"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Past History
        </button>

        <button
          onClick={() => setActiveTab("cancelled")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "cancelled"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
          Loading reservations...
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-700 font-semibold">No {activeTab} reservations found</p>
          <p className="text-slate-500 text-xs mt-1 mb-4">
            {activeTab === "upcoming"
              ? "You do not have any upcoming bookings scheduled."
              : `No reservations in the ${activeTab} category.`}
          </p>
          {activeTab === "upcoming" && (
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Book a Resource
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((item) => {
            const isConfirmed = item.status === "CONFIRMED";
            const isFuture = new Date(item.endAt) >= new Date();

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{item.title}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isConfirmed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-teal-700">{item.resource?.name}</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {item.resource?.category}
                    </span>
                    {item.resource?.location && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.resource.location}
                      </span>
                    )}
                  </div>

                  {item.purpose && (
                    <p className="text-xs text-slate-500 italic">“{item.purpose}”</p>
                  )}
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {new Date(item.startAt).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {new Date(item.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(item.endAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {isConfirmed && isFuture && (
                    <button
                      onClick={() => setCancellingItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cancel Reservation?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to cancel the reservation for{" "}
                  <strong>"{cancellingItem.title}"</strong> on {cancellingItem.resource?.name}?
                </p>
                <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                  Note: This action frees this time slot immediately, allowing other team members to book the resource.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
