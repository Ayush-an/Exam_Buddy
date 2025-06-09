const mongoose = require('mongoose');


if (!userId || !category || !section || !set || !examAttemptId ||
    typeof score === 'undefined' || !totalQuestions || !correctAnswers ||
    typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
  console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
  return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
}