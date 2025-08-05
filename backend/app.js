// backend/app.js
const mongoose = require('mongoose');
const express = require("express");
const cors = require('cors');
const app = express();
require('dotenv').config();

const UserRoute = require("./routes/user.router");
const questionRouter = require('./routes/question.router');
const AdminRoute = require('./routes/admin.router');
const { QuestionPaper } = require('./models/question.model');

// MongoDB Atlas Connection
(async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Atlas connected successfully!');
    await QuestionPaper.seedInitialData();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/admin", AdminRoute);
app.use("/api/user", UserRoute);
app.use("/api", questionRouter);
app.use("/api/questions", questionRouter);

// Test Route
app.get('/api/test', (req, res) => {
  res.send('Test route from app.js working!');
});

// Root route
app.get("/", (req, res) => {
  res.send("Exam-buddy API is running!");
});

console.log('Using Mongo URI:', process.env.MONGO_URI);
module.exports = app;
