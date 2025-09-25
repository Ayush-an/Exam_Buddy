// backend/controller/submitExamResults.js
const mongoose = require('mongoose');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/user.model');
const { Question } = require('../models/question.model');
const MessageServices = require('../services/message.services'); // Twilio service

exports.submitExamResults = async (req, res) => {
  try {
    const { userId, category, section, set, duration, answers } = req.body;

    // --- Existing validation and score calculation logic remains unchanged ---
    if (!userId || !category || !section || !set ||
        typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
      console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
      return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Validation error: Invalid userId format provided:', userId);
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    let calculatedScore = 0;
    let totalMarksPossible = 0;
    let correctAnswersCount = 0;
    let totalQuestionsCount = answers.length;

    const questionIds = answers.map(answer => mongoose.Types.ObjectId(answer.questionId));
    const questionsInExam = await Question.find({ '_id': { $in: questionIds } }).lean();
    const questionMarksMap = new Map();
    questionsInExam.forEach(q => questionMarksMap.set(q._id.toString(), q.marks));

    const processedAnswers = answers.map(answer => {
      const questionIdStr = answer.questionId.toString();
      const questionMarks = questionMarksMap.get(questionIdStr) || 0;
      let marksAwardedForThisQuestion = answer.isCorrect ? questionMarks : 0;

      if (answer.isCorrect) correctAnswersCount++;
      calculatedScore += marksAwardedForThisQuestion;
      totalMarksPossible += questionMarks;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        marksAwarded: marksAwardedForThisQuestion
      };
    });

    const newExamAttempt = await ExamAttempt.create({
      userId,
      category,
      section,
      set,
      score: calculatedScore,
      totalMarksPossible,
      totalQuestions: totalQuestionsCount,
      correctAnswers: correctAnswersCount,
      duration,
      answers: processedAnswers,
      submittedAt: new Date(),
    });

    console.log('Exam attempt saved successfully:', newExamAttempt._id);

    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { examHistory: newExamAttempt._id } },
        { new: true, upsert: false }
      );

      if (!updatedUser) {
        console.warn(`Warning: User with ID ${userId} not found when linking exam attempt.`);
      } else {
        console.log(`Exam attempt ${newExamAttempt._id} linked to user ${userId}.`);
      }
    } catch (userUpdateError) {
      console.warn(`Could not link exam attempt ${newExamAttempt._id} to user ${userId}:`, userUpdateError.message);
    }

    // --- Twilio SMS / WhatsApp Logic ---
    try {
      const user = await User.findById(userId);
      if (user && user.mobile) {
        const message = `Hello ${user.name || 'Student'}, you scored ${calculatedScore}/${totalMarksPossible} in your ${category} exam.`;

        // Send SMS
        await MessageServices.sendSMS(user.mobile, message);

        // Send WhatsApp
        await MessageServices.sendWhatsApp(user.mobile, message);

        console.log(`✅ Exam score sent to user ${user.mobile} via SMS & WhatsApp`);
      }
    } catch (twilioError) {
      console.error('Error sending Twilio message:', twilioError.message);
    }

    res.status(201).json({
      message: 'Exam results submitted successfully!',
      examResult: {
        mongoId: newExamAttempt._id,
        score: calculatedScore,
        totalMarksPossible,
        totalQuestions: totalQuestionsCount,
        correctAnswers: correctAnswersCount,
        duration
      }
    });

  } catch (error) {
    console.error('Error in submitExamResults controller:', error);
    res.status(500).json({ message: 'Internal server error during exam submission.', error: error.message });
  }
};
