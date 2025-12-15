# 🎯 Productivity Dashboard

A full-stack Progressive Web App for personal productivity management.

## Features
- 📝 Task Management
- 📓 Notes with Markdown
- 🎯 Habit Tracking with Streaks
- 🍅 Pomodoro Timer
- 💾 Offline-First Architecture
- 🔄 Auto-Sync
- 🎨 Multiple Themes
- 📱 Installable as Native App

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS, IndexedDB
- **Backend:** Node.js, Express, MySQL
- **PWA:** Service Workers, Web App Manifest

## Installation

### Prerequisites
- Node.js 16+
- MySQL 8.0+

### Setup
1. Clone repository
2. Install dependencies:
```bash
   cd server && npm install
   cd ../client && npm install
```
3. Configure environment variables
4. Create database:
```bash
   mysql -u root -p < server/schema.sql
```
5. Start backend:
```bash
   cd server && npm run dev
```
6. Start frontend:
```bash
   cd client && npm run dev
```

## Usage
Open `http://localhost:5173` in your browser.

## Keyboard Shortcuts
- `Ctrl/Cmd + 1` - Dashboard
- `Ctrl/Cmd + 2` - Tasks
- `Ctrl/Cmd + 3` - Notes
- `Ctrl/Cmd + 4` - Habits
- `Ctrl/Cmd + 5` - Pomodoro

## License
MIT
