const state = {
  tasks: [],
  todos: [],
  budgets: [],
  expenses: [],
  goals: [],
  habits: []
};

let sequence = 1;

export function nextId(prefix) {
  return `${prefix}_${sequence++}`;
}

export function getState() {
  return state;
}

export function resetState() {
  state.tasks.length = 0;
  state.todos.length = 0;
  state.budgets.length = 0;
  state.expenses.length = 0;
  state.goals.length = 0;
  state.habits.length = 0;
  sequence = 1;
}
