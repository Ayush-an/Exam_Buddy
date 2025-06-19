// models/ExamAttempt.js
const mongoose = require('mongoose');
const Question = require('./question.model'); // Ensure this path is correct
const User = require('./user.model'); // Ensure this path is correct
const { v4: uuidv4 } = require('uuid');

// Schema for individual answers within an exam attempt
const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, required: true }, // e.g., 'a', 'b', 'c', 'd' or actual option content
  isCorrect: { type: Boolean, required: true },
  marksAwarded: { type: Number, required: true, default: 0 } // NEW: Marks obtained for this specific question (0 if incorrect, question.marks if correct)
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
  score: { type: Number, required: true }, // Total score obtained by the user
  totalMarksPossible: { type: Number, required: true }, // NEW: Total possible marks for the attempted exam
  totalQuestions: { type: Number, required: true }, // Total number of questions in the exam
  correctAnswers: { type: Number, required: true }, // Count of correct answers
  duration: { type: Number, required: true }, // Duration of the attempt in minutes or seconds
  answers: [answerSchema], // Array of individual answer details
  submittedAt: { type: Date, default: Date.now } // Timestamp of submission
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
