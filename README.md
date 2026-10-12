# PrimeWave RMS — Resource Reservation Management System

PrimeWave RMS is a full-stack web application for managing shared organizational resources and reservations. Staff can browse resources, check availability, create and manage their reservations, while administrators can manage resources and oversee reservations. The application is designed to prevent conflicting bookings and protect administrative actions through role-based access control.

## Project Overview & Business Scenario

Organizations frequently manage high-demand shared resources:
- Client conference rooms and agile team pods
- Audio/Visual equipment (4K wireless projectors, mobile displays)
- Company vehicle fleets (passenger vans, executive sedans)
- Collaborative team workspaces

When reservations are managed through informal communications (messaging apps, spreadsheets, sticky notes), organizations suffer from:
1. **Scheduling Confusion & Double Bookings**: Multiple teams show up at the same time for the same resource.
2. **Lack of Live Visibility**: Team members cannot easily see when a facility is occupied or when it frees up.
3. **No Centralized Governance**: Administrators lack visibility over resource utilization or the ability to manage deactivations and cancellations.

## The Technical Solution
This centralized web application resolves these operational challenges by providing:
- **Strict Overlap Prevention**: Enforcing half-open intervals `[startAt, endAt)` where `existing.startAt < requestedEnd && existing.endAt > requestedStart`.
- **Database-Level Concurrency Safeguards**: A PostgreSQL exclusion constraint with `btree_gist` prevents race conditions even under concurrent simultaneous booking attempts.
- **Interactive Availability Timeline**: Visual 30-minute availability slots enabling one-click selection of free time ranges.
- **Role-Based Access Control (RBAC)**: Segregated permissions between Staff Members (`USER`) and Operations Leads (`ADMIN`).


## Features

- **Authentication and access control:** Register and sign in with secure password hashing and cookie-based JWT sessions.
- **Role-based permissions:** Separate staff (`USER`) and administrator (`ADMIN`) capabilities.
- **Resource directory:** Browse and filter resources by category, including meeting rooms, equipment, vehicles, and workspaces.
- **Resource administration:** Administrators can create, update, activate, and deactivate resources.
- **Reservation management:** Create reservations, view personal bookings, and cancel reservations where permitted.
- **Availability timeline:** View availability in 30-minute slots for a selected date and resource.
- **Conflict prevention:** Reject overlapping reservations for the same resource while allowing bookings that meet end-to-start without overlapping.
- **Administrator reservation view:** Review and manage reservations across the organization.
- **Responsive interface:** Layouts designed for desktop and smaller screens.
- **Automated tests:** Unit tests cover reservation overlap cases and availability timeline behavior.

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** | Server Components, Client Components, dynamic layouts |
| **Language** | **TypeScript 5** | Strict end-to-end type safety |
| **Styling** | **Tailwind CSS** | Responsive dashboard UI with clean design system |
| **Database** | **PostgreSQL 16** | Relational persistence, GiST indexing, range constraints |
| **ORM** | **Prisma 5** | Schema definitions, migrations, type-safe queries |
| **Validation** | **Zod** | Server-side and client-side input validation |
| **Authentication** | **JOSE (JWT) + Cookies** | Secure HTTP-only cookie sessions with RBAC |
| **Password Hashing** | **Bcrypt.js** | Salted password hashing (passwords never stored plain) |
| **Icons** | **Lucide React** | Clean, accessible iconography |
| **Testing** | **Vitest** | Unit test suite covering all interval overlap scenarios |
| **Containerization** | **Docker Compose** | Instant one-command PostgreSQL 16 container |

## Requirements

Install the following before setting up the project:

- Node.js 20 LTS or a compatible supported version
- npm
- Docker Desktop with Docker Compose, or a PostgreSQL database you can access
- Git

## Setup and Installation

### 1. Clone the repository

Replace the URL below with the URL of your GitHub repository:

```bash
git clone https://github.com/YOUR_USERNAME/resource-reservation-management-system.git
cd resource-reservation-management-system
```

If you downloaded the source code as a ZIP file, extract it and open a terminal in the project directory instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file to `.env`.

On macOS/Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` as needed:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/resource_reservation?schema=public"
JWT_SECRET="replace-this-with-a-long-random-secret"
NODE_ENV="development"
PORT=3000
```

- `DATABASE_URL` must point to your PostgreSQL database.
- Set `JWT_SECRET` to a long, random secret for your local environment. Do not commit `.env` or real secrets to GitHub.
- The values above are for local development only; use secure credentials for any deployed environment.

### 4. Start PostgreSQL

To run the included PostgreSQL 16 container:

```bash
docker compose up -d
```

The Compose configuration creates a database named `resource_reservation` and runs `prisma/init-db.sql` when the database volume is initialized. If you use an existing PostgreSQL instance, create a database and update `DATABASE_URL` accordingly.

### 5. Generate Prisma Client and prepare the database

```bash
npx prisma generate
npx prisma db push
```

To enable database-level protection against simultaneous overlapping bookings, apply the SQL constraint after the schema has been created. Run this command from the project root if `psql` is installed and your connection details match the local configuration:

```bash
psql "postgresql://postgres:postgrespassword@localhost:5432/resource_reservation" -f prisma/migrations/exclusion_constraint.sql
```

The SQL uses PostgreSQL's `btree_gist` extension and an exclusion constraint. If you use a different database connection, update the connection string accordingly. Apply the constraint only once; if it already exists, do not add it again.

### 6. Add sample data (optional)

The seed script creates sample staff and administrator accounts, resources, and reservations. Run it against a development database:

```bash
npm run prisma:seed
```

**Important:** Seeding clears existing reservations, resources, and users before inserting the sample records. Do not run it against a database containing data you need to keep.

Sample sign-in accounts created by the seed script:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Operations Lead (ADMIN)** | `admin@primewave.com` | `Admin@123` | Full system access: add/edit resources, toggle activation, view all reservations, administrative cancellation override. |
| **Staff Member (USER)** | `user@primewave.com` | `Password@123` | View active resources, reserve available slots, view/cancel own reservations. |
| **Staff Member 2 (USER)** | `sarah@primewave.com` | `Password@123` | Independent staff account for testing cross-user booking and ownership rules. |

*Note: The login page includes convenient **⚡ Demo Quick-Fill** buttons to populate credentials in one click.*

These credentials are intended for local assessment and development only. Change or remove them before deploying the application publicly.

### 7. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The root route redirects to the application dashboard.

To create a production build and run it locally:

```bash
npm run build
npm run start
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server after building |
| `npm test` | Run the Vitest test suite |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:seed` | Populate the development database with sample records |

## Main Application Areas

- `/login` — Sign in to the application.
- `/register` — Create a staff account.
- `/dashboard` — View dashboard statistics and recent activity.
- `/resources` — Browse and filter resources; administrators can manage resources.
- `/book` — Check availability and create a reservation.
- `/reservations` — View and manage your reservations.
- `/admin/reservations` — Administrator view for organization-wide reservation management.
- `/profile` — View the user profile.

Some pages and actions require authentication or administrator permissions.

## Reservation Conflict Rules

The application treats a reservation as a half-open interval, `[startAt, endAt)`. Two reservations for the same resource overlap when:

```text
existing.startAt < requestedEnd && existing.endAt > requestedStart
```

This means a booking from 09:00 to 10:00 can be followed by a booking from 10:00 to 11:00, but a booking from 09:30 to 10:30 conflicts with the first booking. Cancelled reservations do not block availability.

The application checks for conflicts in its reservation logic. PostgreSQL's exclusion constraint in `prisma/migrations/exclusion_constraint.sql` adds a database-level safeguard against concurrent requests creating overlapping confirmed reservations.

## Running Tests

Run the unit tests with:

```bash
npm test
```

The overlap tests cover exact duplicates, partial overlaps, bookings that start or end at an existing booking boundary, enclosing intervals, non-overlapping reservations, and availability timeline slots.





