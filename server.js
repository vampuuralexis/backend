const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS and JSON parsing must be at the top!
app.use(cors());
app.use(express.json());

// Data file path (simple JSON file storage)
const DATA_PATH = path.join(__dirname, "data.json");

// Helper: Load data
function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return { users: {}, classes: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH));
  } catch (error) {
    console.error("Error reading data file:", error);
    return { users: {}, classes: {} };
  }
}

// Helper: Save data
function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file:", error);
  }
}

// Test routes
app.get("/", (req, res) => {
  res.json({ message: "Class Management Backend is running!" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Register new user
app.post("/api/register", (req, res) => {
  console.log("Register request received:", req.body);
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
  
  console.log("User registered successfully:", username);
  res.json({ message: "Registered successfully" });
});

// Login user
app.post("/api/login", (req, res) => {
  console.log("Login request received:", req.body);
  const { username, password } = req.body;
  
  const data = loadData();
  
  if (data.users[username] && data.users[username] === password) {
    console.log("Login successful for:", username);
    return res.json({ message: "Login success" });
  }
  
  console.log("Login failed for:", username);
  res.status(401).json({ message: "Invalid credentials" });
});

// Get classes
app.get("/api/classes", (req, res) => {
  console.log("Get classes request received");
  const data = loadData();
  res.json(data.classes || {});
});

// Add class
app.post("/api/classes", (req, res) => {
  console.log("Add class request received:", req.body);
  const { className } = req.body;
  
  if (!className) {
    return res.status(400).json({ message: "Missing className" });
  }
  
  const data = loadData();
  
  if (data.classes[className]) {
    return res.status(409).json({ message: "Class exists" });
  }
  
  data.classes[className] = [];
  saveData(data);
  
  console.log("Class added successfully:", className);
  res.json({ message: "Class added" });
});

// Delete class
app.delete("/api/classes/:className", (req, res) => {
  console.log("Delete class request received:", req.params.className);
  const { className } = req.params;
  
  const data = loadData();
  
  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }
  
  delete data.classes[className];
  saveData(data);
  
  console.log("Class deleted successfully:", className);
  res.json({ message: "Class deleted" });
});

// Update class name
app.put("/api/classes/:oldClassName", (req, res) => {
  console.log("Update class name request received:", req.params.oldClassName, "->", req.body.newClassName);
  const { oldClassName } = req.params;
  const { newClassName } = req.body;

  if (!newClassName) {
    return res.status(400).json({ message: "Missing newClassName" });
  }

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

  console.log("Class name updated successfully:", oldClassName, "->", newClassName);
  res.json({ message: "Class name updated" });
});

// Add student to class
app.post("/api/classes/:className/students", (req, res) => {
  console.log("Add student request received:", req.params.className, req.body);
  const { className } = req.params;
  const { studentName } = req.body;
  
  if (!studentName) {
    return res.status(400).json({ message: "Missing studentName" });
  }
  
  const data = loadData();
  
  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }
  
  data.classes[className].push(studentName);
  saveData(data);
  
  console.log("Student added successfully:", studentName, "to", className);
  res.json({ message: "Student added" });
});

// Delete student from class
app.delete("/api/classes/:className/students/:index", (req, res) => {
  console.log("Delete student request received:", req.params);
  const { className, index } = req.params;
  
  const data = loadData();
  
  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }
  
  const idx = parseInt(index);
  
  if (idx < 0 || idx >= data.classes[className].length) {
    return res.status(400).json({ message: "Invalid index" });
  }
  
  const removedStudent = data.classes[className][idx];
  data.classes[className].splice(idx, 1);
  saveData(data);
  
  console.log("Student deleted successfully:", removedStudent, "from", className);
  res.json({ message: "Student deleted" });
});

// Update student name
app.put("/api/classes/:className/students/:index", (req, res) => {
  console.log("Update student request received:", req.params, req.body);
  const { className, index } = req.params;
  const { newStudentName } = req.body;

  if (!newStudentName) {
    return res.status(400).json({ message: "Missing newStudentName" });
  }

  const data = loadData();

  if (!data.classes[className]) {
    return res.status(404).json({ message: "Class not found" });
  }

  const idx = parseInt(index);

  if (idx < 0 || idx >= data.classes[className].length) {
    return res.status(400).json({ message: "Invalid index" });
  }

  const oldName = data.classes[className][idx];
  data.classes[className][idx] = newStudentName;
  saveData(data);

  console.log("Student name updated successfully:", oldName, "->", newStudentName);
  res.json({ message: "Student name updated" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
