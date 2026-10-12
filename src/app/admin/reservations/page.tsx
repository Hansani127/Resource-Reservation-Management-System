"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { ReservationItem, ResourceItem } from "@/types";
import {
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Layers,
  ArrowUpDown,
  X,
  AlertCircle,
} from "lucide-react";

export default function AdminReservationsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Admin Cancel Modal
  const [cancellingItem, setCancellingItem] = useState<ReservationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resReservations, resResources] = await Promise.all([
        fetch("/api/reservations?scope=all"),
        fetch("/api/resources?all=true"),
      ]);

      if (resReservations.ok) {
        const data = await resReservations.json();
        setReservations(data.reservations || []);
      }

      if (resResources.ok) {
        const data = await resResources.json();
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error("Failed to load admin reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData();
    }
  }, [authLoading, isAdmin]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      // Status filter
      if (selectedStatus !== "All" && item.status !== selectedStatus) {
        return false;
      }

      // Resource filter
      if (selectedResource !== "All" && item.resourceId !== selectedResource) {
        return false;
      }

      // Search query (matches title, organizer name, email, resource name)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesUser =
          item.user?.name.toLowerCase().includes(query) ||
          item.user?.email.toLowerCase().includes(query);
        const matchesResource = item.resource?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesUser && !matchesResource) {
          return false;
        }
      }

      return true;
    });
  }, [reservations, selectedStatus, selectedResource, search]);

  const handleAdminCancel = async () => {
    if (!cancellingItem) return;
    setCancelling(true);
    setMessage(null);

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

      setMessage(`Reservation "${cancellingItem.title}" was cancelled by administrator.`);
      setCancellingItem(null);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Administrator Access Required</h2>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          This portal is reserved for PrimeWave Lab operations administrators.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Organization-Wide Reservations</h1>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Admin Control
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Audit all reservations, resolve schedule overlaps, and exercise administrative cancellations.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
        >
          Refresh Feed
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-purple-600 hover:text-purple-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, user, resource..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Resource Filter */}
        <div>
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED Only</option>
            <option value="CANCELLED">CANCELLED Only</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Reservation & Purpose</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Organizer</th>
                <th className="py-3 px-4">Time Interval</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading administrative records...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching reservations found.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      {item.purpose && (
                        <div className="text-[11px] text-slate-500 italic max-w-xs truncate">
                          {item.purpose}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-teal-700">{item.resource?.name}</span>
                      <span className="block text-[11px] text-slate-400">{item.resource?.category}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.user?.name}</div>
                      <div className="text-[11px] text-slate-400">{item.user?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>
                        {new Date(item.startAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-slate-500">
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
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                          item.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.status === "CONFIRMED" && (
                        <button
                          onClick={() => setCancellingItem(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Cancellation Confirmation Modal */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Administrative Override</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  As an administrator, cancel booking for{" "}
                  <strong>"{cancellingItem.title}"</strong> by{" "}
                  <strong>{cancellingItem.user?.name}</strong>?
                </p>
                <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                  This cancels the booking immediately and re-opens the facility schedule.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleAdminCancel}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
