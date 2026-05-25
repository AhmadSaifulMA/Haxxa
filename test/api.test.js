import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

let server;
let base;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("health endpoint", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, "ok");
});

test("create and complete a task", async () => {
  await fetch(`${base}/api/test/reset`, { method: "POST" });

  const createRes = await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Workout", priority: "high" })
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.completed, false);

  const completeRes = await fetch(`${base}/api/tasks/${created.id}/complete`, { method: "PATCH" });
  assert.equal(completeRes.status, 200);
  const completed = await completeRes.json();
  assert.equal(completed.completed, true);
});

test("reject invalid JSON", async () => {
  const res = await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid"
  });
  assert.equal(res.status, 400);
});

test("dashboard aggregates metrics", async () => {
  await fetch(`${base}/api/test/reset`, { method: "POST" });

  const taskRes = await fetch(`${base}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Task 1" })
  });
  const task = await taskRes.json();
  await fetch(`${base}/api/tasks/${task.id}/complete`, { method: "PATCH" });

  await fetch(`${base}/api/expenses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ category: "food", amount: 25 })
  });

  const habitRes = await fetch(`${base}/api/habits`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Meditate" })
  });
  const habit = await habitRes.json();
  await fetch(`${base}/api/habits/${habit.id}/log`, { method: "POST" });

  const dashRes = await fetch(`${base}/api/dashboard`);
  assert.equal(dashRes.status, 200);
  const dash = await dashRes.json();
  assert.equal(dash.tasks.completionRate, 100);
  assert.equal(dash.spendingToday, 25);
  assert.equal(dash.bestHabitStreak, 1);
});
