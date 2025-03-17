const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
 
const app = express();
app.use(express.json());
app.use(cors());
 
mongoose.connect("mongodb://localhost:27017/quizapp", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));
 
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" } // "admin" or "user"
});
 
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
});
 
const User = mongoose.model("User", UserSchema);
const Question = mongoose.model("Question", QuestionSchema);
 
// Register User (default role = "user")
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error registering user" });
  }
});
 
//user login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
   
    const token = jwt.sign({ userId: user._id }, "secrect-key", { expiresIn: "1h" });
    res.json({ token });
  });
 
  app.get("/questions", async (req, res) => {
    const questions = await Question.find();
    res.json(questions);
  });
 
  app.post("/submit-quiz", async (req, res) => {
    const { answers } = req.body;
   
    try {
      const questions = await Question.find();
      let score = 0;
   
      questions.forEach((q, index) => {
        if (q.correctAnswer === answers[index]) {
          score++;
        }
      });
   
      res.json({ score });
      console.log(score);
    } catch (error) {
      res.status(500).json({ error: "Error calculating score" });
    }
  });
// Admin Login
app.post("/admin/login", async (req, res) => {
  const {email,password } = req.body;
  const admin = await User.findOne({email,role: "admin" });
  if (!admin) return res.status(400).json({ error: "Admin not found" });
 
//   const isMatch = await bcrypt.compare(password, admin.password);
    if(password===admin.password)
    {
        isMatch=true;
    }
    else{
        isMatch=false;
    }
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
 
  const token = jwt.sign({userId: admin._id,role: "admin" }, "secrect-key", { expiresIn: "1h" });
  res.json({ token });
});
 
// Add Question (Admin only)
app.post("/admin/add-question", async (req, res) => {
  const { question, options, correctAnswer, token } = req.body;
 
  try {
    const decoded = jwt.verify(token, "secrect-key");
    if (decoded.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
 
    const newQuestion = new Question({ question, options, correctAnswer });
    await newQuestion.save();
    res.json({ message: "Question added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error adding question" });
  }
});
 
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));