// models/ExamAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'D' or actual option text
  isCorrect: { type: Boolean, required: true }
});

const examAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  section: { type: String, required: true },
  set: { type: String, required: true },
  examAttemptId: { type: String, required: true, unique: true }, // This is the string ID from frontend
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  duration: { type: Number, required: true }, // duration in seconds
  answers: [answerSchema], // Array of objects conforming to answerSchema
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);