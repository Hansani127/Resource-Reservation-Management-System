import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Run parallel counts for performance
    const [
      totalResources,
      activeResources,
      todayReservationsCount,
      upcomingReservationsCount,
      recentReservations,
    ] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.count({ where: { isActive: true } }),
      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
          startAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
          startAt: { gt: now },
        },
      }),
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          resource: {
            select: { id: true, name: true, category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalResources,
      activeResources,
      todayReservationsCount,
      upcomingReservationsCount,
      recentReservations,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
