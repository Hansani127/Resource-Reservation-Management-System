export type UserRole = "ADMIN" | "USER";

export type ReservationStatus = "CONFIRMED" | "CANCELLED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reservations: number;
  };
}

export interface ReservationItem {
  id: string;
  title: string;
  purpose: string | null;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  userId: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  resource?: {
    id: string;
    name: string;
    category: string;
    location: string | null;
  };
}

export interface DashboardStats {
  totalResources: number;
  activeResources: number;
  todayReservationsCount: number;
  upcomingReservationsCount: number;
  recentReservations: ReservationItem[];
}
