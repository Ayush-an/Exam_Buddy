// examAttempt.controller.js
const ExamAttempt = require('../models/ExamAttempt.model');

exports.getAttemptById = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await ExamAttempt.findById(id)
      .populate('examId')
      .populate('userId', 'username')

    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    res.status(200).json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
