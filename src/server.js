import http from "node:http";
import { URL } from "node:url";
import { getState, nextId, resetState } from "./services/store.js";
import { badRequest, json, notFound, readBody, serverError } from "./services/http.js";

export const PORT = process.env.PORT || 3000;

const PRIORITIES = new Set(["low", "medium", "high"]);
const TODO_STATUSES = new Set(["todo", "in_progress", "done"]);

function match(path, pattern) {
  const p = path.split("/").filter(Boolean);
  const pp = pattern.split("/").filter(Boolean);
  if (p.length !== pp.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = p[i];
    else if (pp[i] !== p[i]) return null;
  }
  return params;
}

function isoDate(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  return input;
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const state = getState();

      if (req.method === "GET" && pathname === "/health") return json(res, 200, { status: "ok" });
      if (req.method === "POST" && pathname === "/api/test/reset") {
        resetState();
        return json(res, 200, { ok: true });
      }

      if (req.method === "GET" && pathname === "/api/tasks") return json(res, 200, state.tasks);
      if (req.method === "POST" && pathname === "/api/tasks") {
        const body = await readBody(req);
        if (!body.title || typeof body.title !== "string") return badRequest(res, "title is required");
        const priority = (body.priority ?? "medium").toLowerCase();
        if (!PRIORITIES.has(priority)) return badRequest(res, "priority must be low|medium|high");
        const date = isoDate(body.date);
        if (!date) return badRequest(res, "date must be YYYY-MM-DD");

        const task = { id: nextId("task"), title: body.title.trim(), priority, completed: false, date };
        state.tasks.push(task);
        return json(res, 201, task);
      }

      const completeParams = match(pathname, "/api/tasks/:id/complete");
      if (req.method === "PATCH" && completeParams) {
        const item = state.tasks.find((x) => x.id === completeParams.id);
        if (!item) return notFound(res);
        item.completed = true;
        return json(res, 200, item);
      }

      if (req.method === "GET" && pathname === "/api/todos") return json(res, 200, state.todos);
      if (req.method === "POST" && pathname === "/api/todos") {
        const body = await readBody(req);
        if (!body.title || typeof body.title !== "string") return badRequest(res, "title is required");
        const todo = {
          id: nextId("todo"),
          title: body.title.trim(),
          status: "todo",
          recurring: Boolean(body.recurring),
          subtasks: Array.isArray(body.subtasks) ? body.subtasks : []
        };
        state.todos.push(todo);
        return json(res, 201, todo);
      }

      const statusParams = match(pathname, "/api/todos/:id/status");
      if (req.method === "PATCH" && statusParams) {
        const body = await readBody(req);
        if (!TODO_STATUSES.has(body.status)) return badRequest(res, "invalid status");
        const item = state.todos.find((x) => x.id === statusParams.id);
        if (!item) return notFound(res);
        item.status = body.status;
        return json(res, 200, item);
      }

      if (req.method === "GET" && pathname === "/api/budgets") return json(res, 200, state.budgets);
      if (req.method === "POST" && pathname === "/api/budgets") {
        const body = await readBody(req);
        if (!body.category || typeof body.limit !== "number" || body.limit < 0) return badRequest(res, "category and non-negative numeric limit are required");
        const budget = { id: nextId("budget"), category: String(body.category), limit: body.limit };
        state.budgets.push(budget);
        return json(res, 201, budget);
      }

      if (req.method === "GET" && pathname === "/api/expenses") return json(res, 200, state.expenses);
      if (req.method === "POST" && pathname === "/api/expenses") {
        const body = await readBody(req);
        if (!body.category || typeof body.amount !== "number" || body.amount < 0) return badRequest(res, "category and non-negative numeric amount are required");
        const date = isoDate(body.date);
        if (!date) return badRequest(res, "date must be YYYY-MM-DD");
        const expense = { id: nextId("expense"), category: String(body.category), amount: body.amount, date };
        state.expenses.push(expense);
        return json(res, 201, expense);
      }

      if (req.method === "GET" && pathname === "/api/goals") return json(res, 200, state.goals);
      if (req.method === "POST" && pathname === "/api/goals") {
        const body = await readBody(req);
        if (!body.title || typeof body.title !== "string") return badRequest(res, "title is required");
        const goal = { id: nextId("goal"), title: body.title.trim(), category: body.category ?? "personal_growth", progress: 0, milestones: Array.isArray(body.milestones) ? body.milestones : [] };
        state.goals.push(goal);
        return json(res, 201, goal);
      }

      const progressParams = match(pathname, "/api/goals/:id/progress");
      if (req.method === "PATCH" && progressParams) {
        const body = await readBody(req);
        if (typeof body.progress !== "number" || body.progress < 0 || body.progress > 100) return badRequest(res, "progress must be 0..100");
        const item = state.goals.find((x) => x.id === progressParams.id);
        if (!item) return notFound(res);
        item.progress = body.progress;
        return json(res, 200, item);
      }

      if (req.method === "GET" && pathname === "/api/habits") return json(res, 200, state.habits);
      if (req.method === "POST" && pathname === "/api/habits") {
        const body = await readBody(req);
        if (!body.title || typeof body.title !== "string") return badRequest(res, "title is required");
        const habit = { id: nextId("habit"), title: body.title.trim(), streak: 0, lastLoggedAt: null };
        state.habits.push(habit);
        return json(res, 201, habit);
      }

      const logParams = match(pathname, "/api/habits/:id/log");
      if (req.method === "POST" && logParams) {
        const item = state.habits.find((x) => x.id === logParams.id);
        if (!item) return notFound(res);
        item.streak += 1;
        item.lastLoggedAt = new Date().toISOString();
        return json(res, 200, item);
      }

      if (req.method === "GET" && pathname === "/api/dashboard") {
        const today = new Date().toISOString().slice(0, 10);
        const spendingToday = state.expenses.filter((e) => e.date === today).reduce((a, b) => a + b.amount, 0);
        const tasksDone = state.tasks.filter((t) => t.completed).length;
        const completionRate = state.tasks.length ? Math.round((tasksDone / state.tasks.length) * 100) : 0;
        return json(res, 200, {
          tasks: { total: state.tasks.length, completed: tasksDone, completionRate },
          spendingToday,
          goalsInProgress: state.goals.filter((g) => g.progress < 100).length,
          bestHabitStreak: Math.max(0, ...state.habits.map((h) => h.streak))
        });
      }

      return notFound(res);
    } catch (error) {
      if (error?.name === "SyntaxError") return badRequest(res, "invalid JSON payload");
      return serverError(res, "internal server error");
    }
  });
}

if (process.argv[1] && process.argv[1].endsWith("src/server.js")) {
  createServer().listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
