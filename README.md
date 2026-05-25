# Personal Development & Life Management App (MVP)

This repository contains a Phase-1 MVP backend implementation derived from `PRD.md`.

## Implemented Scope (MVP API)

- Daily task management
- Smart to-do lists with subtasks and recurring flag
- Budget categories and expense tracking
- Goal tracking with milestones
- Habit tracking with streak logic
- Integrated dashboard summary endpoint

## Tech Stack

- Node.js built-in HTTP server (no external runtime dependencies)
- In-memory repository for rapid MVP iteration
- Node built-in test runner

## Run

```bash
npm start
```

Server default: `http://localhost:3000`.

## Test

```bash
npm test
```

## API Endpoints

### Health
- `GET /health`

### Daily Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/complete`

### To-Do
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/:id/status`

### Budgets & Expenses
- `GET /api/budgets`
- `POST /api/budgets`
- `GET /api/expenses`
- `POST /api/expenses`

### Goals
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/:id/progress`

### Habits
- `GET /api/habits`
- `POST /api/habits`
- `POST /api/habits/:id/log`

### Dashboard
- `GET /api/dashboard`

## Notes

- Persistence, authentication, notifications, OCR, and bank integrations are planned for next phases.
- Added integration-style API tests for health, task flow, invalid JSON handling, and dashboard aggregation.
