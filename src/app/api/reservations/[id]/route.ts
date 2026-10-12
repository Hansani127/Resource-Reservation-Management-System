import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // action: "cancel"

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { resource: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Authorization check: User can only cancel their own booking, Admin can cancel any booking
    const isOwner = reservation.userId === session.id;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this reservation" },
        { status: 403 }
      );
    }

    if (action === "cancel") {
      if (reservation.status === "CANCELLED") {
        return NextResponse.json({ message: "Reservation is already cancelled", reservation });
      }

      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { resource: true },
      });

      return NextResponse.json({
        message: "Reservation successfully cancelled. The time slot is now available for other bookings.",
        reservation: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Modify reservation error:", error);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
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

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Only owner or admin can view detail
    if (reservation.userId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Get reservation error:", error);
    return NextResponse.json({ error: "Failed to retrieve reservation" }, { status: 500 });
  }
}
