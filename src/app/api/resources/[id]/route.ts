import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: "CONFIRMED",
            endAt: { gte: new Date() },
          },
          orderBy: { startAt: "asc" },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Fetch resource details error:", error);
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Support partial updates (e.g., toggling isActive or editing full details)
    const partialSchema = resourceSchema.partial();
    const result = partialSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ message: "Resource updated successfully", resource: updated });
  } catch (error) {
    console.error("Update resource error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
