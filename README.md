# erez-management — מערכת ניהול תיקים

A full-stack legal case management system for a law firm, built with React and a self-hosted Supabase backend.

---

## Features

- **Authentication** — Login / logout with role-based access (admin / employee)
- **Dashboard** — Overview of all cases with search, filtering, and status indicators
- **Case Management** — Create, edit, and track legal cases with full detail pages
- **Task Assignments** — Assign employees to cases with priority, status, and deadlines
- **Reports** — Visual summaries of case workload and status
- **Users Management** — Admin panel for managing employee accounts
- **Settings** — Light / dark theme toggle, user preferences
- **Excel Export** — Export case data to `.xlsx` with one click
- **RTL Support** — Full right-to-left Hebrew UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router DOM v7 |
| Backend | Supabase (self-hosted via Docker) |
| Auth | Supabase GoTrue |
| Database | PostgreSQL with Row Level Security |
| Export | SheetJS (xlsx) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A running self-hosted Supabase instance

### 1. Clone the repo

```bash
git clone https://github.com/workdavid353-oss/erez-management.git
cd erez-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env.local` file in the root:

```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Get these values from your Supabase Studio → Project Settings → API.

### 4. Set up the database

Run `supabase_schema.sql` in Supabase Studio (SQL Editor) to create all tables and RLS policies.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Database Schema

```
profiles          — extends auth.users (full_name, role)
cases             — main case records
case_assignments  — links cases to employees with task details
```

Row Level Security is enabled on all tables. Employees see only their own assigned cases; admins see everything.

---

## Project Structure

```
src/
├── components/      # Shared UI (Sidebar, Modals, Icons)
├── context/         # AuthContext (user session + profile)
├── lib/             # supabase.js client, helpers
├── pages/           # One file per screen
│   ├── DashboardPage.jsx
│   ├── CasesPage.jsx
│   ├── CaseDetailPage.jsx
│   ├── TasksPage.jsx
│   ├── ReportsPage.jsx
│   ├── UsersPage.jsx
│   └── SettingsPage.jsx
└── App.jsx          # Root shell + navigation state
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## Notes

- `.env.local` is excluded from git — never commit your Supabase keys.
- The app expects Supabase to be running locally on port `8000` (Kong gateway).
- Theme preference is persisted in `localStorage`.
