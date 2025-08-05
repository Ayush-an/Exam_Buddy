// models/ExamAttempt.js
const mongoose = require('mongoose');
const Question = require('./question.model');
const User = require('./user.model');
const { v4: uuidv4 } = require('uuid');

// Schema for individual answers within an exam attempt
const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, required: true }, // 'a', 'b', 'c', 'd' or actual option content
  isCorrect: { type: Boolean, required: true },
  marksAwarded: { type: Number, required: true, default: 0 } 
});

// Main schema for an exam attempt
const examAttemptSchema = new mongoose.Schema({
  examAttemptId: {
    type: String,
    unique: true,
    default: uuidv4 // Automatically generate UUID
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  section: { type: String, required: true },
  set: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarksPossible: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  duration: { type: Number, required: true },
  answers: [answerSchema],
  submittedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ExamAttempt', examAttemptSchema);