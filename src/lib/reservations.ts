import { PrismaClient } from "@prisma/client";

/**
 * Pure function to test overlap between two half-open intervals [start, end)
 * Interval A overlaps Interval B if and only if:
 * A.start < B.end AND A.end > B.start
 */
export function hasOverlap(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Verifies whether a resource has any active CONFIRMED reservation
 * conflicting with the requested [requestedStart, requestedEnd) interval.
 */
export async function findReservationConflict(
  db: PrismaClient,
  resourceId: string,
  requestedStart: Date,
  requestedEnd: Date,
  excludeReservationId?: string
) {
  return await db.reservation.findFirst({
    where: {
      resourceId,
      status: "CONFIRMED",
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      startAt: { lt: requestedEnd },
      endAt: { gt: requestedStart },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resource: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export interface TimeSlot {
  time: string; // e.g. "09:00"
  dateTime: Date;
  isAvailable: boolean;
  reservationId?: string;
  reservationTitle?: string;
}

/**
 * Generates 30-minute availability slots for a given date (08:00 to 18:00)
 */
export function generateDayTimeline(
  targetDate: Date,
  confirmedReservations: Array<{ id: string; title: string; startAt: Date; endAt: Date }>
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 18;

  const baseDate = new Date(targetDate);
  baseDate.setSeconds(0, 0);

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const slotStart = new Date(baseDate);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      // Check if slot falls within any confirmed reservation
      const overlapping = confirmedReservations.find((res) =>
        hasOverlap(res.startAt, res.endAt, slotStart, slotEnd)
      );

      slots.push({
        time: timeString,
        dateTime: slotStart,
        isAvailable: !overlapping,
        reservationId: overlapping?.id,
        reservationTitle: overlapping?.title,
      });
    }
  }

  return slots;
}
