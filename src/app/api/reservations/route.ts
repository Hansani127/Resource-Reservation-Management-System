import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reservationSchema } from "@/lib/validations";
import { findReservationConflict } from "@/lib/reservations";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const status = searchParams.get("status");
    const scope = searchParams.get("scope"); // "all" (admin only) or "my"

    const whereClause: Record<string, unknown> = {};

    // Authorization rule: regular users only see their own reservations
    // Admins can see all if scope === "all"
    if (session.role !== "ADMIN" || scope !== "all") {
      whereClause.userId = session.id;
    }

    if (resourceId) {
      whereClause.resourceId = resourceId;
    }

    if (status && (status === "CONFIRMED" || status === "CANCELLED")) {
      whereClause.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            category: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: "desc" },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("List reservations error:", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please log in to make a reservation" }, { status: 401 });
    }

    const body = await request.json();
    const result = reservationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid reservation data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { resourceId, title, purpose, startAt, endAt } = result.data;

    // Rule 1: Cannot book in the past (allow small 1-minute grace for clock skew)
    const now = new Date(Date.now() - 60000);
    if (startAt < now) {
      return NextResponse.json(
        { error: "Reservation start time must be in the future." },
        { status: 400 }
      );
    }

    // Rule 2: Resource must exist and be active
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    if (!resource.isActive) {
      return NextResponse.json(
        { error: "This resource is currently deactivated and unavailable for booking." },
        { status: 400 }
      );
    }

    // Rule 3: Check for overlapping confirmed reservations:
    // Overlap condition: existing.startAt < requestedEnd && existing.endAt > requestedStart
    const conflict = await findReservationConflict(prisma, resourceId, startAt, endAt);

    if (conflict) {
      const conflictStartStr = new Date(conflict.startAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const conflictEndStr = new Date(conflict.endAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return NextResponse.json(
        {
          error: `This resource is already reserved (${conflictStartStr} – ${conflictEndStr}: "${conflict.title}"). Please choose another time.`,
          conflictId: conflict.id,
        },
        { status: 409 }
      );
    }

    // Rule 4: Atomic insertion & database-level concurrency protection
    try {
      const reservation = await prisma.reservation.create({
        data: {
          resourceId,
          title,
          purpose: purpose || null,
          startAt,
          endAt,
          status: "CONFIRMED",
          userId: session.id,
        },
        include: {
          resource: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(
        { message: "Reservation created successfully", reservation },
        { status: 201 }
      );
    } catch (dbError: unknown) {
      // Catch PostgreSQL exclusion constraint violation (P2004 or raw constraint)
      const err = dbError as { code?: string; message?: string };
      if (
        err?.code === "P2004" ||
        err?.code === "P2010" ||
        err?.message?.includes("exclusion constraint") ||
        err?.message?.includes("no_overlapping_confirmed_reservations")
      ) {
        return NextResponse.json(
          { error: "This time slot was just booked by another user. Please choose another time." },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation. Please try again." },
      { status: 500 }
    );
  }
}
