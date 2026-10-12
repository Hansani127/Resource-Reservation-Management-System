import { PrismaClient, UserRole, ReservationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding for PrimeWave Lab...");

  // Clear existing records in reverse dependency order
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Kasun Silva (Operations)",
      email: "admin@primewave.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Dilshan Fernando",
      email: "user@primewave.com",
      passwordHash: passwordHash,
      role: UserRole.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Sarah Perera",
      email: "sarah@primewave.com",
      passwordHash: passwordHash,
      role: UserRole.USER,
    },
  });

  console.log(` Created 3 demo users (Admin: admin@primewave.com, Users: user@primewave.com, sarah@primewave.com)`);

  // Create Resources
  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        name: "Meeting Room A",
        description: "Primary client-facing conference room equipped with dual video displays and whiteboards.",
        category: "Meeting Room",
        location: "Floor 1, West Wing",
        capacity: 10,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Meeting Room B",
        description: "Agile sprint planning and small team discussion room with smart TV.",
        category: "Meeting Room",
        location: "Floor 2, East Wing",
        capacity: 6,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Executive Conference Hall",
        description: "Large auditorium for company-wide all-hands, investor pitches, and workshops.",
        category: "Meeting Room",
        location: "Floor 3, Executive Suite",
        capacity: 25,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "High-Definition Projector 01",
        description: "Epson 4K Laser wireless projector with HDMI and USB-C adapters.",
        category: "Equipment",
        location: "IT Equipment Locker #4",
        capacity: 1,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "4K Mobile Display Rig",
        description: "65-inch digital whiteboard on mobile caster wheels with stylus support.",
        category: "Equipment",
        location: "Design Studio Hub",
        capacity: 1,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Company Shuttle Van (WP-CAD-4022)",
        description: "8-seater passenger van dedicated for client transfers and external events.",
        category: "Vehicle",
        location: "Basement Parking Bay 03",
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Company Hybrid Sedan (WP-CAB-8821)",
        description: "Toyota Prius hybrid reserved for executive travel and off-site client meetings.",
        category: "Vehicle",
        location: "Basement Parking Bay 01",
        capacity: 4,
        isActive: true,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Quiet Focus Studio (Pod 3)",
        description: "Sound-isolated acoustic focus room for recording demos and private calls.",
        category: "Workspace",
        location: "Floor 2, Quiet Zone",
        capacity: 2,
        isActive: false, // Inactive example to test filtering & booking guards
      },
    }),
  ]);

  console.log(` Created ${resources.length} resources`);

  // Create Reservations
  const now = new Date();
  
  // Today 10:00 - 11:30 (Room A)
  const today10am = new Date(now);
  today10am.setHours(10, 0, 0, 0);
  const today1130am = new Date(now);
  today1130am.setHours(11, 30, 0, 0);

  // Today 14:00 - 15:00 (Room A - Back to back later today)
  const today2pm = new Date(now);
  today2pm.setHours(14, 0, 0, 0);
  const today3pm = new Date(now);
  today3pm.setHours(15, 0, 0, 0);

  // Tomorrow 09:00 - 11:00 (Executive Hall)
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);
  const tomorrow11am = new Date(now);
  tomorrow11am.setDate(tomorrow11am.getDate() + 1);
  tomorrow11am.setHours(11, 0, 0, 0);

  // Tomorrow 13:00 - 17:00 (Company Shuttle Van)
  const tomorrow1pm = new Date(now);
  tomorrow1pm.setDate(tomorrow1pm.getDate() + 1);
  tomorrow1pm.setHours(13, 0, 0, 0);
  const tomorrow5pm = new Date(now);
  tomorrow5pm.setDate(tomorrow5pm.getDate() + 1);
  tomorrow5pm.setHours(17, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      title: "Sprint Review & Planning",
      purpose: "Review Sprint 14 deliverables with engineering leads and product owners.",
      startAt: today10am,
      endAt: today1130am,
      status: ReservationStatus.CONFIRMED,
      userId: user1.id,
      resourceId: resources[0].id,
    },
  });

  await prisma.reservation.create({
    data: {
      title: "Client Technical Demo",
      purpose: "Presenting the new web portal architecture to enterprise clients.",
      startAt: today2pm,
      endAt: today3pm,
      status: ReservationStatus.CONFIRMED,
      userId: user2.id,
      resourceId: resources[0].id,
    },
  });

  await prisma.reservation.create({
    data: {
      title: "Quarterly Strategy Townhall",
      purpose: "All-hands executive townhall and Q3 targets rollout.",
      startAt: tomorrow9am,
      endAt: tomorrow11am,
      status: ReservationStatus.CONFIRMED,
      userId: admin.id,
      resourceId: resources[2].id,
    },
  });

  await prisma.reservation.create({
    data: {
      title: "Colombo Tech Fair Team Transport",
      purpose: "Transporting team members and showcase equipment to BMICH conference hall.",
      startAt: tomorrow1pm,
      endAt: tomorrow5pm,
      status: ReservationStatus.CONFIRMED,
      userId: user1.id,
      resourceId: resources[5].id,
    },
  });

  console.log(" Created 4 sample reservations across resources");
  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
