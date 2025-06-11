const mongoose = require('mongoose');
const express = require("express");
const cors = require('cors');

const app = express();

const UserRoute = require("./routes/user.router");
const questionRouter = require('./routes/question.router');
const AdminRoute = require('./routes/admin.router');

const { QuestionPaper } = require('./models/question.model'); // Ensure path is correct

// MongoDB Connection
(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/Exam_buddy');
    console.log('MongoDB connected successfully!');
    await QuestionPaper.seedInitialData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static file serving
app.use('/uploads', express.static('uploads'));

// API Routes
app.use("/api/admin", AdminRoute);
app.use("/api/user", UserRoute);
app.use("/api", questionRouter);
app.use("/api/questions", questionRouter);
// Optional Test Route
app.get('/api/test', (req, res) => {
  res.send('Test route from app.js working!');
});

// Root route
app.get("/", (req, res) => {
  res.send("Exam-buddy API is running!");
});

module.exports = app;