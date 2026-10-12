"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { ResourceItem } from "@/types";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Info,
  CalendarCheck2,
} from "lucide-react";

interface SlotData {
  time: string;
  dateTime: string;
  isAvailable: boolean;
  reservationId?: string;
  reservationTitle?: string;
}

function BookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialResourceId = searchParams.get("resourceId") || "";

  const { user, loading: authLoading } = useAuth();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState(initialResourceId);
  
  // Format today as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch active resources
  useEffect(() => {
    async function loadResources() {
      try {
        const res = await fetch("/api/resources");
        if (res.ok) {
          const data = await res.json();
          const activeOnly = (data.resources || []).filter((r: ResourceItem) => r.isActive);
          setResources(activeOnly);
          if (!selectedResourceId && activeOnly.length > 0) {
            setSelectedResourceId(activeOnly[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load resources", err);
      }
    }
    loadResources();
  }, [selectedResourceId]);

  // Fetch availability slots whenever selected resource or date changes
  useEffect(() => {
    if (!selectedResourceId || !date) return;

    async function loadAvailability() {
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/availability?resourceId=${selectedResourceId}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        }
      } catch (err) {
        console.error("Failed to load availability", err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadAvailability();
  }, [selectedResourceId, date]);

  const selectedResource = useMemo(() => {
    return resources.find((r) => r.id === selectedResourceId);
  }, [resources, selectedResourceId]);

  // Compute requested start/end timestamps
  const requestedStart = useMemo(() => {
    if (!date || !startTime) return null;
    return new Date(`${date}T${startTime}:00`);
  }, [date, startTime]);

  const requestedEnd = useMemo(() => {
    if (!date || !endTime) return null;
    return new Date(`${date}T${endTime}:00`);
  }, [date, endTime]);

  // Client-side quick conflict calculation
  const hasClientConflict = useMemo(() => {
    if (!requestedStart || !requestedEnd || slots.length === 0) return false;
    if (requestedEnd <= requestedStart) return false;

    // Check if any occupied slot intersects
    for (const slot of slots) {
      if (!slot.isAvailable) {
        const slotStart = new Date(slot.dateTime);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
        if (slotStart < requestedEnd && slotEnd > requestedStart) {
          return true;
        }
      }
    }
    return false;
  }, [requestedStart, requestedEnd, slots]);

  const handleSlotClick = (slot: SlotData) => {
    if (!slot.isAvailable) return;
    setStartTime(slot.time);

    // Compute end time + 1 hour or 30 mins
    const [h, m] = slot.time.split(":").map(Number);
    const endH = m === 30 ? h + 1 : h + 1;
    const endM = m === 30 ? "30" : "00";
    if (endH < 19) {
      setEndTime(`${String(endH).padStart(2, "0")}:${endM}`);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!requestedStart || !requestedEnd) {
      setErrorMessage("Please specify valid start and end times.");
      return;
    }

    if (requestedEnd <= requestedStart) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    if (requestedStart.getTime() <= Date.now()) {
      setErrorMessage("Reservation start time must be in the future.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          title,
          purpose: purpose || null,
          startAt: requestedStart.toISOString(),
          endAt: requestedEnd.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm reservation.");
      }

      setSuccessMessage("Reservation confirmed successfully! Redirecting...");
      setTimeout(() => {
        router.push("/reservations");
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Reservation failed.");
    } finally {
      setSubmitting(false);
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
        <AlertCircle className="w-12 h-12 text-teal-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Please Sign In First</h2>
        <p className="text-slate-600 text-sm mt-2 mb-6">
          You need to be logged in to reserve organizational resources.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck2 className="w-6 h-6 text-teal-600" />
          Reserve a Resource
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Coordinate meeting facilities and equipment with guaranteed conflict prevention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-teal-600" />
            Booking Specifications
          </h2>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="leading-relaxed font-semibold">{successMessage}</div>
            </div>
          )}

          {hasClientConflict && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <strong>Time Conflict Detected:</strong> The requested interval overlaps with an existing confirmed reservation.
              </div>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            {/* Resource Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Resource *
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {resources.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.name} ({res.category} {res.capacity ? `• Capacity ${res.capacity}` : ""})
                  </option>
                ))}
              </select>

              {selectedResource && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <div className="font-semibold text-slate-800">{selectedResource.name}</div>
                  <div>Location: {selectedResource.location || "Main Campus"}</div>
                  {selectedResource.description && (
                    <div className="text-slate-500 text-[11px] mt-1">{selectedResource.description}</div>
                  )}
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reservation Date *
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Time *
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    step="1800" // 30-min increments
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  End Time *
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    step="1800"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Title / Meeting Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Meeting / Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Executive Budget Review"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Purpose / Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Purpose / Meeting Agenda (Optional)
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Briefly state key attendees, equipment needs, or objective..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || hasClientConflict}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition ${
                hasClientConflict
                  ? "bg-amber-600 hover:bg-amber-700 cursor-not-allowed opacity-80"
                  : "bg-teal-600 hover:bg-teal-700"
              } disabled:opacity-50`}
            >
              {submitting ? (
                "Validating & Reserving..."
              ) : hasClientConflict ? (
                "Resolve Time Overlap"
              ) : (
                <>
                  Confirm Reservation <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Availability Timeline & Time-Slot Grid (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Schedule Availability Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Live view for {date} • Click any available slot to prefill your booking time
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-400"></span>
                <span className="text-slate-600 text-[11px]">Available</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-400"></span>
                <span className="text-slate-600 text-[11px]">Reserved</span>
              </span>
            </div>
          </div>

          {loadingSlots ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
              Calculating resource timeline...
            </div>
          ) : slots.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Select a resource to inspect daily schedule slots.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Slot grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {slots.map((slot) => {
                  const isSelected =
                    startTime === slot.time ||
                    (requestedStart &&
                      requestedEnd &&
                      new Date(slot.dateTime) >= requestedStart &&
                      new Date(slot.dateTime) < requestedEnd);

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between h-20 ${
                        !slot.isAvailable
                          ? "bg-rose-50/70 border-rose-200 text-rose-900 cursor-not-allowed opacity-90"
                          : isSelected
                          ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950 font-medium"
                          : "bg-slate-50/70 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{slot.time}</span>
                        {slot.isAvailable ? (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                            Free
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-semibold bg-rose-100/60 px-1.5 py-0.5 rounded">
                            Booked
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] truncate mt-1">
                        {slot.isAvailable ? (
                          <span className="text-slate-400">Click to select</span>
                        ) : (
                          <span className="text-rose-700 font-medium truncate block" title={slot.reservationTitle}>
                            {slot.reservationTitle || "Confirmed"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Technical Rule Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Half-Open Intervals:</strong> Reservations follow the mathematical standard{" "}
                  <code className="text-teal-700 font-mono">[startAt, endAt)</code>. A meeting ending at 11:00 AM does not conflict with a new reservation starting at 11:00 AM.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading booking interface...</div>}>
      <BookContent />
    </Suspense>
  );
}
