import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 初始化数据库
const adapter = new JSONFile(path.join(__dirname, 'db.json'));
const db = new Low(adapter, { todos: [] });

await db.read();
await db.write();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve fitness carbon cycle plan page
app.use('/fitness-plan', express.static(path.join(__dirname, 'public/fitness-plan')));

// 获取所有待办事项
app.get('/todos', async (req, res) => {
  await db.read();
  res.json(db.data.todos);
});

// 添加新待办事项
app.post('/todos', async (req, res) => {
  const newTodo = {
    id: Date.now().toString(),
    text: req.body.text,
    completed: false,
    date: req.body.date || null,
    type: req.body.type || 'life'
  };
  db.data.todos.push(newTodo);
  await db.write();
  res.status(201).json(newTodo);
});

// 获取单个待办事项
app.get('/todos/:id', async (req, res) => {
  const todo = db.data.todos.find(t => t.id === req.params.id);
  if (!todo) return res.sendStatus(404);
  res.json(todo);
});

// 更新待办事项详情或状态
app.put('/todos/:id', async (req, res) => {
  const todo = db.data.todos.find(t => t.id === req.params.id);
  if (!todo) return res.sendStatus(404);

  if (req.body.details !== undefined) {
    todo.details = req.body.details;
  }

  if (req.body.completed !== undefined) {
    todo.completed = req.body.completed;
  }

  if (req.body.date !== undefined) {
    todo.date = req.body.date;
  }

  await db.write();
  res.json(todo);
});

// 删除待办事项
app.delete('/todos/:id', async (req, res) => {
  const index = db.data.todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.sendStatus(404);
  db.data.todos.splice(index, 1);
  await db.write();
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
