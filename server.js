const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files relative to this file so starting from any CWD works
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database for tasks
let tasks = [
  { id: 1, title: 'Sample Task 1', completed: false, details: 'Example details' },
  { id: 2, title: 'Sample Task 2', completed: true, details: 'Another example' },
];

// Routes
// Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Add a new task
app.post('/api/tasks', (req, res) => {
  const { title, details } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = { id: tasks.length + 1, title, completed: false, details: details || '' };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { completed, title, details } = req.body;
  const task = tasks.find((t) => t.id === parseInt(id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (typeof completed !== 'undefined') {
    task.completed = completed;
  }
  if (typeof title !== 'undefined') {
    task.title = title;
  }
  if (typeof details !== 'undefined') {
    task.details = details;
  }
  res.json(task);
});

// Get a single task by id
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id === parseInt(id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter((t) => t.id !== parseInt(id));
  res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});