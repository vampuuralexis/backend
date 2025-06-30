// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Data file path (simple JSON file storage)
const DATA_PATH = path.join(__dirname, "data.json");

// Helper: Load data
function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return { users: {}, classes: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH));
}

// Helper: Save data
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Register new user
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }
  const data = loadData();
  if (data.users[username]) {
    return res.status(409).json({ message: "User exists" });
  }
  data.users[username] = password; // In real life, hash this!
  saveData(data);
  res.json({ message: "Registered successfully" });
});

// Login user
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const data = loadData();
  if (data.users[username] && data.users[username] === password) {
    // In real life, create JWT token here
    return res.json({ message: "Login success" });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

// Get classes
app.get("/api/classes", (req, res) => {
  const data = loadData();
  res.json(data.classes || {});
});

// Add class
app.post("/api/classes", (req, res) => {
  const { className } = req.body;
  if (!className) return res.status(400).json({ message: "Missing className" });
  const data = loadData();
  if (data.classes[className]) {
    return res.status(409).json({ message: "Class exists" });
  }
  data.classes[className] = [];
  saveData(data);
  res.json({ message: "Class added" });
});

// Delete class
app.delete("/api/classes/:className", (req, res) => {
  const { className } = req.params;
  const data = loadData();
  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }
  delete data.classes[className];
  saveData(data);
  res.json({ message: "Class deleted" });
});

// Add student to class
app.post("/api/classes/:className/students", (req, res) => {
  const { className } = req.params;
  const { studentName } = req.body;
  if (!studentName) return res.status(400).json({ message: "Missing studentName" });
  const data = loadData();
  if (!data.classes[className]) return res.status(404).json({ message: "Class not found" });
  data.classes[className].push(studentName);
  saveData(data);
  res.json({ message: "Student added" });
});

// Delete student from class
app.delete("/api/classes/:className/students/:index", (req, res) => {
  const { className, index } = req.params;
  const data = loadData();
  if (!data.classes[className]) return res.status(404).json({ message: "Class not found" });
  const idx = parseInt(index);
  if (idx < 0 || idx >= data.classes[className].length) return res.status(400).json({ message: "Invalid index" });
  data.classes[className].splice(idx, 1);
  saveData(data);
  res.json({ message: "Student deleted" });
});

// Update class name
app.put("/api/classes/:oldClassName", (req, res) => {
  const { oldClassName } = req.params;
  const { newClassName } = req.body;

  if (!newClassName) return res.status(400).json({ message: "Missing newClassName" });

  const data = loadData();

  if (!data.classes[oldClassName]) {
    return res.status(404).json({ message: "Class not found" });
  }

  if (data.classes[newClassName]) {
    return res.status(409).json({ message: "New class name already exists" });
  }

  // Rename the class key
  data.classes[newClassName] = data.classes[oldClassName];
  delete data.classes[oldClassName];

  saveData(data);

  res.json({ message: "Class name updated" });
});

// Update student name
app.put("/api/classes/:className/students/:index", (req, res) => {
  const { className, index } = req.params;
  const { newStudentName } = req.body;

  if (!newStudentName) return res.status(400).json({ message: "Missing newStudentName" });

  const data = loadData();

  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }

  const idx = parseInt(index);

  if (idx < 0 || idx >= data.classes[className].length) {
    return res.status(400).json({ message: "Invalid index" });
  }

  // Update the student name
  data.classes[className][idx] = newStudentName;

  saveData(data);

  res.json({ message: "Student name updated" });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const cors = require("cors");
app.use(cors());

