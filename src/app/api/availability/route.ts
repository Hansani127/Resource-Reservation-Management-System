import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDayTimeline } from "@/lib/reservations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch confirmed reservations for the selected day and resource
    const confirmedReservations = await prisma.reservation.findMany({
      where: {
        resourceId,
        status: "CONFIRMED",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
      },
      orderBy: { startAt: "asc" },
    });

    const slots = generateDayTimeline(targetDate, confirmedReservations);

    return NextResponse.json({
      date: targetDate.toISOString().split("T")[0],
      resourceId,
      confirmedReservations,
      slots,
    });
  } catch (error) {
    console.error("Fetch availability error:", error);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
