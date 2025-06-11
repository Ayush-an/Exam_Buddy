// models/ExamAttempt.js
const mongoose = require('mongoose');
const Question = require('./question.model');
const User = require('./user.model');
const { v4: uuidv4 } = require('uuid');
const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'D' or actual option text
  isCorrect: { type: Boolean, required: true }
});

const examAttemptSchema = new mongoose.Schema({
  examAttemptId: {
    type: String,
    unique: true,
    default: uuidv4  // ✅ generate UUID automatically
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: String,
  section: String,
  set: String,
  score: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  duration: Number,
  answers: [answerSchema],
  submittedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('ExamAttempt', examAttemptSchema);