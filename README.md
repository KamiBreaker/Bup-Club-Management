# 🎓 BUP Club & Society Management System (CMS)

A modern, full-stack campus management platform built for **Bangladesh University of Professionals (BUP)** to streamline club administration, society activities, event organization, campus venue bookings, automated notifications, and administrative analytics.

---

## ✨ Features

- 🏛️ **Club & Society Directory**: Discover campus clubs, explore leadership structures, apply for membership, and manage executive rosters.
- 📅 **Event Hub**: Browse upcoming workshops, hackathons, and seminars. Filter events by category and register with a single click.
- 📍 **Smart Venue Booking Engine**: Conflict-free campus venue reservation system for club executives with automated admin approval workflows.
- 🔔 **Notification Center**: Automated system notifications for event registrations, venue approval status changes, and club updates.
- 📊 **Admin Analytics Dashboard**: Interactive real-time metrics and charts powered by Recharts (club activity, venue utilization, membership growth, attendance rates).
- 🔑 **Role-Based Access Control (RBAC)**: Custom views and permissions for **Students**, **Club Executives**, and **System Administrators**.
- 🤖 **AI Assistant Integration**: Powered by Google Gemini API with fallback capabilities for offline operations.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Animations**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://motion.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)

### **Backend**
- **Server**: [Express.js](https://expressjs.com/) with TypeScript (`tsx`)
- **Database**: [SQLite](https://sqlite.org/) via `better-sqlite3` (persistent file-based database)
- **Authentication**: JWT (`jsonwebtoken`) & password hashing with `bcryptjs`
- **AI Integration**: `@google/genai` (Google Gemini SDK)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **bun** package manager

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bup-club-society-management-system.git
   cd bup-club-society-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** *(Optional)*:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: The application includes offline fallbacks, so a Gemini API key is optional for local development.*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Express backend & Vite frontend concurrently in dev mode |
| `npm run build` | Builds frontend assets & bundles backend into production CJS |
| `npm start` | Launches the production bundled server |
| `npm run lint` | Runs TypeScript type checking |
| `npm run clean` | Cleans up the `dist/` directory |

---

## 📁 Project Structure

```
├── public/                 # Static assets (BUP logo, brand images)
├── src/
│   ├── components/         # Modular UI components
│   │   ├── cms/            # CMS modules (Clubs, Events, Venues, Notifications, Admin Analytics)
│   │   └── common/         # Common layout components (Header, Navigation)
│   ├── data/               # Mock fallback & seed datasets
│   ├── types/              # TypeScript interface & type definitions
│   ├── App.tsx             # Main application container
│   ├── index.css           # Global Tailwind CSS styles
│   └── main.tsx            # React application entry point
├── server.ts               # Express API server & SQLite database initialization
├── bup-cms.db              # SQLite database (auto-generated on launch)
├── package.json            # Project dependencies & scripts
└── vite.config.ts          # Vite build configuration
```

---

## 📄 License

This project is licensed under the Apache 2.0 License.
