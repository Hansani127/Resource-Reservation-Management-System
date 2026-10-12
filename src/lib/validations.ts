import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const resourceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().min(2, "Category is required"),
  location: z.string().trim().max(100).optional().nullable(),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const reservationSchema = z.object({
  resourceId: z.string().min(1, "Resource is required"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  purpose: z.string().trim().max(500).optional().nullable(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
}).refine((data) => data.endAt > data.startAt, {
  message: "End time must be after start time",
  path: ["endAt"],
});
