import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const all = searchParams.get("all") === "true";

    const session = await getSession();
    const isAdmin = session?.role === "ADMIN";

    // Regular users can only see active resources unless admin explicitly requested all
    const whereClause: Record<string, unknown> = {};

    if (!isAdmin || !all) {
      whereClause.isActive = true;
    }

    if (category && category !== "All") {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                status: "CONFIRMED",
                endAt: { gte: new Date() },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Fetch resources error:", error);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const result = resourceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: result.data,
    });

    return NextResponse.json({ message: "Resource created successfully", resource }, { status: 201 });
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
