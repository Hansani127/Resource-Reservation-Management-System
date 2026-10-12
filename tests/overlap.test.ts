import { describe, it, expect } from "vitest";
import { hasOverlap, generateDayTimeline } from "../src/lib/reservations";

describe("Resource Reservation Overlap Prevention Algorithm", () => {
  // Existing reservation: 10:00 AM to 11:00 AM (2026-10-15)
  const baseDate = "2026-10-15";
  const existingStart = new Date(`${baseDate}T10:00:00`);
  const existingEnd = new Date(`${baseDate}T11:00:00`);

  it("Scenario 1: Preceding back-to-back booking (09:00–10:00 AM) MUST BE ALLOWED", () => {
    const requestedStart = new Date(`${baseDate}T09:00:00`);
    const requestedEnd = new Date(`${baseDate}T10:00:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(false);
  });

  it("Scenario 2: Exact duplicate time slot (10:00–11:00 AM) MUST BE REJECTED", () => {
    const requestedStart = new Date(`${baseDate}T10:00:00`);
    const requestedEnd = new Date(`${baseDate}T11:00:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(true);
  });

  it("Scenario 3: Overlapping start interval (10:30–11:30 AM) MUST BE REJECTED", () => {
    const requestedStart = new Date(`${baseDate}T10:30:00`);
    const requestedEnd = new Date(`${baseDate}T11:30:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(true);
  });

  it("Scenario 4: Following back-to-back booking (11:00 AM–12:00 PM) MUST BE ALLOWED", () => {
    const requestedStart = new Date(`${baseDate}T11:00:00`);
    const requestedEnd = new Date(`${baseDate}T12:00:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(false);
  });

  it("Scenario 5: Encompassing time interval (09:00 AM–12:00 PM) MUST BE REJECTED", () => {
    const requestedStart = new Date(`${baseDate}T09:00:00`);
    const requestedEnd = new Date(`${baseDate}T12:00:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(true);
  });

  it("Scenario 6: Completely disjoint future booking (14:00–15:00 PM) MUST BE ALLOWED", () => {
    const requestedStart = new Date(`${baseDate}T14:00:00`);
    const requestedEnd = new Date(`${baseDate}T15:00:00`);

    const overlaps = hasOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
    expect(overlaps).toBe(false);
  });

  it("Scenario 7: Daily timeline generator marks 10:00 and 10:30 as booked, and others as available", () => {
    const confirmed = [
      {
        id: "res-1",
        title: "Team Sync",
        startAt: existingStart,
        endAt: existingEnd,
      },
    ];

    const slots = generateDayTimeline(new Date(baseDate), confirmed);

    const slot0900 = slots.find((s) => s.time === "09:00");
    const slot1000 = slots.find((s) => s.time === "10:00");
    const slot1030 = slots.find((s) => s.time === "10:30");
    const slot1100 = slots.find((s) => s.time === "11:00");

    expect(slot0900?.isAvailable).toBe(true);
    expect(slot1000?.isAvailable).toBe(false);
    expect(slot1030?.isAvailable).toBe(false);
    expect(slot1100?.isAvailable).toBe(true);
  });
});
