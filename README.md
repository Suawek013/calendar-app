<div align="center">

# 📅 CalMate

### Intelligent Time-Blocking Planner, Habit Tracker & Goal Harmonizer

[![Live Demo](https://img.shields.io/badge/Live_Demo-calmateapp.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://calmateapp.vercel.app/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A sleek, glassmorphic productivity application bridging daily time-blocking, habit streaks, and long-term goal setting into one cohesive workflow.</b><br>
  Plan your ideal week, track daily consistency, and share your schedule with partners in real time.
</p>

[🌐 **Explore Live Demo**](https://calmateapp.vercel.app/) • [✨ Features](#-key-features) • [🛠️ Tech Stack](#-tech-stack) • [🚀 Quick Start](#-quick-start) • [🗄️ Database Setup](#-database--supabase-setup)

---

</div>

## 📖 Overview

**CalMate** is a high-performance personal calendar and habit tracking dashboard designed to help people reclaim focus and align their daily routine with long-term aspirations. By combining **weekly visual time-blocking**, **daily habit streaks**, **milestone goal tracking**, and **partner calendar overlays**, CalMate eliminates fragmented productivity tools.

---

## ✨ Key Features

### 🗓️ Visual Weekly Time-Blocking Planner
- **Dynamic Grid Layout**: Effortlessly view and organize your 7-day schedule with customizable density modes (**Compact**, **Regular**, **Comfy**).
- **Time Block Customization**: Color-code blocks by category (Deep Work, Exercise, Learning, Social, Rest) with rich emoji badges and custom notes.
- **Flexible Grid Controls**: Toggle weekend tinting, customize week start day (Monday vs. Sunday), and switch between 12-hour (AM/PM) and 24-hour clocks.

### ⚡ Built-in Habit Tracking & Streaks
- **Direct Calendar Integration**: Link recurring habits directly into calendar blocks or check them off via the fast daily habit checklist.
- **Consistency Tracking**: Real-time streak counters, weekly completion percentages, and habit history logs.
- **Habit Catalog**: Create and customize habits with emoji icons, target frequencies (daily, X times per week), and color themes.

### 🎯 Milestone Goal Planning Engine
- **Yearly & Monthly Goals**: Define high-level ambitions and break them down into measurable milestones.
- **Progress Tracking**: Automatic visual progress calculation, milestone checklists, and dynamic monthly trajectory charts.
- **Habit Connections**: Connect specific daily habits to bigger long-term milestones to ensure daily execution.

### 👥 Partner & Shared Calendar Overlay
- **View-Only Calendar Sharing**: Generate secure, unique public share links for partners, family members, or teammates.
- **Visual Schedule Overlay**: Toggle a partner's calendar over your own to instantly discover overlapping free time and plan shared activities.
- **Privacy Controls**: Choose between sharing full event details or only busy/free availability.

### 📈 "Where Time Goes" Productivity Analytics
- **Time Distribution Breakdown**: Interactive graphs displaying total hours invested across different life pillars over **Last 7 Days** or **Last 30 Days**.
- **Sleep & Rest Quality**: Dedicated rest tracking alongside productive output.

### 🌐 Native Multi-Language Support (i18n)
- **Instant Language Switching**: Full support for both **English (EN)** and **Polish (PL)** across all dialogs, labels, and settings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row-Level Security, Realtime) |
| **Icons & Emojis** | [Lucide React](https://lucide.dev/) & [Emoji Picker React](https://github.com/ealmansi/emoji-picker-react) |
| **Styling & UI** | Custom Vanilla CSS with sleek glassmorphism, responsive CSS grid, and dark theme support |
| **State & Localization** | React Hooks (`useState`, `useEffect`, `useContext`) + Built-in i18n Engine |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🏗️ Architecture & Project Structure

```text
calendarapp/
├── custom-blocks-schema.sql  # SQL schema for custom user time blocks
├── supabase-schema.sql       # Database schema (habits, logs, goals, profiles)
├── supabase-seed.sql         # Initial demo seed data
├── vite.config.js            # Vite build configuration
├── src/
│   ├── main.jsx              # React application entry point
│   ├── App.jsx               # Main state orchestrator & navigation
│   ├── calendar.jsx          # Time-blocking grid component & interaction handlers
│   ├── dashboard.jsx         # Time distribution analytics & daily habit overview
│   ├── goals.jsx             # Goal roadmap overview & category grouping
│   ├── goal-detail.jsx       # Detailed milestone tracker & progress charts
│   ├── goal-modal.jsx        # Goal creation and editing modal
│   ├── setup.jsx             # Habit management & configuration interface
│   ├── profile.jsx           # Account settings, preferences & calendar sharing
│   ├── login.jsx             # Supabase Auth sign-in / registration
│   ├── modal.jsx             # Event block creation & editing modal
│   ├── components.jsx        # Shared UI components (Icons, Buttons, Dropdowns)
│   ├── data.jsx              # Data generation helpers, date math & seed configs
│   ├── goals-data.jsx        # Goal data models & calculations
│   ├── i18n.jsx              # Internationalization dictionaries (EN & PL)
│   ├── supabase.js           # Supabase client initialization
│   └── styles.css            # Custom CSS design system & animations
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com/) account

### 1. Clone the repository
```bash
git clone https://github.com/Suawek013/calendar-app.git
cd calendarapp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database & Supabase Setup

To set up the Supabase database:

1. Create a project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the scripts in the following order:
   1. `supabase-schema.sql` (Creates profiles, habits, habit logs, goals, and share tokens)
   2. `custom-blocks-schema.sql` (Creates custom user-defined schedule blocks)
   3. `supabase-seed.sql` *(Optional: seeds starter templates and sample data)*
4. Ensure Email Authentication is enabled in your Supabase Auth provider settings.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Designed & Developed by Sławomir Sojka · Live at <a href="https://calmateapp.vercel.app/">calmateapp.vercel.app</a></sub>
</div>
