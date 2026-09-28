# ⚡ TaskPulse AI — Intelligent Team Task & Deadline Manager

[![Official Live Demo](https://img.shields.io/badge/Live%20Demo-Official%20Site-10b981?style=for-the-badge&logo=github)](https://abdurraheem467.github.io/taskplus-ai/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/AbdurRaheem467/taskplus-ai)

> 🚀 **Official Live Application URL:** [https://abdurraheem467.github.io/taskplus-ai/](https://abdurraheem467.github.io/taskplus-ai/)

A modern, professional SaaS web application designed for engineering managers, product leads, and operations directors to delegate tasks, track deadlines in real-time, and configure automated reminders using **natural voice commands in English, Urdu, and Roman Urdu**.

---

## 🌟 Key Features

- **🎙️ Multilingual AI Voice Task Creation:**
  - Speaks English & Urdu / Roman Urdu (*"Basit Amin Bhatti ko website ka homepage complete karna hai, deadline 30 September shaam 6 baje hai"*).
  - Web Audio live microphone waveform visualizer & recording timer.
  - Ambiguity detection & interactive clarification prompts.
  - Confirmation summary guard before any task is committed.
- **📊 Executive Dashboard:**
  - 6 Key Metrics: Total, Pending, In Progress, Completed, Overdue, and Due Today.
  - "Today's Tasks" with real-time countdown badges (*"Due in 2 hours"*, *"Overdue by 1 day"*).
  - Upcoming deadlines chronological radar.
  - Team workload capacity & progress completion charts.
- **👥 Team Members Management:**
  - Profile cards, customizable avatar colors, roles, and assigned deliverables.
  - Dedicated member detail drawer with all tasks assigned to that individual.
- **📋 Dual-View Task Management:**
  - **List View:** Detailed table with status toggles, priority pills, and actions.
  - **Kanban View:** 3-column drag-and-drop / 1-click status board (`Pending` → `In Progress` → `Completed`) with visual overdue highlighting.
- **📅 Deadline Calendar:**
  - Interactive Month, Week, and Today calendar views.
  - Click any date to view scheduled tasks or schedule directly.
- **🔔 Automated Reminders & Multi-Channel Notifications:**
  - 15m, 30m, 1h, 2h, 1d, or custom interval reminders.
  - Background deadline scanner with audio sound chimes and browser desktop notifications.
- **🗄️ Supabase PostgreSQL Architecture:**
  - Ready-to-run SQL schema with RLS policies and triggers (`supabase_schema.sql`).
- **⚡ n8n Workflow Automation:**
  - Ready-to-import n8n workflow pipeline (`n8n_task_workflow.json`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/taskpulse-ai.git

# Navigate into project directory
cd taskpulse-ai

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 📄 License
MIT License
