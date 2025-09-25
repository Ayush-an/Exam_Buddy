// backend/controller/submitExamResults.js
const mongoose = require('mongoose');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/user.model');
const { Question } = require('../models/question.model');
const MessageServices = require('../services/message.services'); // Twilio service
const { Resend } = require('resend');

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

exports.submitExamResults = async (req, res) => {
  try {
    const { userId, category, section, set, duration, answers } = req.body;

    // --- Validation ---
    if (
      !userId || !category || !section || !set ||
      typeof duration === 'undefined' ||
      !Array.isArray(answers) || answers.length === 0
    ) {
      console.error('Validation error: Missing or invalid required fields.');
      return res.status(400).json({ message: 'Missing or invalid exam attempt data.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Validation error: Invalid userId:', userId);
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // --- Calculate score ---
    let calculatedScore = 0;
    let totalMarksPossible = 0;
    let correctAnswersCount = 0;
    const totalQuestionsCount = answers.length;

    const questionIds = answers.map(a => mongoose.Types.ObjectId(a.questionId));
    const questionsInExam = await Question.find({ '_id': { $in: questionIds } }).lean();

    const questionMarksMap = new Map();
    questionsInExam.forEach(q => questionMarksMap.set(q._id.toString(), q.marks));

    const processedAnswers = answers.map(answer => {
      const qId = answer.questionId.toString();
      const marks = questionMarksMap.get(qId) || 0;
      const marksAwarded = answer.isCorrect ? marks : 0;

      if (answer.isCorrect) correctAnswersCount++;
      calculatedScore += marksAwarded;
      totalMarksPossible += marks;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        marksAwarded
      };
    });

    // --- Save attempt ---
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

    console.log('✅ Exam attempt saved:', newExamAttempt._id);

    // --- Link attempt to user ---
    try {
      await User.findByIdAndUpdate(
        userId,
        { $push: { examHistory: newExamAttempt._id } },
        { new: true }
      );
    } catch (linkErr) {
      console.warn(`⚠️ Could not link attempt ${newExamAttempt._id} to user ${userId}:`, linkErr.message);
    }

    // --- Notify User ---
    try {
      const user = await User.findById(userId);
      if (user) {
        const message = `Hello ${user.name || 'Student'}, you scored ${calculatedScore}/${totalMarksPossible} in your ${category} exam.`;

        // Try Twilio SMS & WhatsApp
        try {
          if (user.mobile) {
            await MessageServices.sendSMS(user.mobile, message);
            await MessageServices.sendWhatsApp(user.mobile, message);
            console.log(`📲 Score sent to ${user.mobile} via SMS & WhatsApp`);
          }
        } catch (twilioErr) {
          console.error('❌ Twilio failed:', twilioErr.message);

          // Fallback to Resend email
          if (user.email) {
            try {
              const { data, error } = await resend.emails.send({
                from: 'ExamBuddy <no-reply@exambuddy.com>',
                to: user.email,
                subject: 'Your Exam Score',
                html: `<p>Hi ${user.name || 'Student'},</p>
                       <p>You scored <strong>${calculatedScore}/${totalMarksPossible}</strong> in your <strong>${category}</strong> exam.</p>
                       <p>Keep up the great work! 🎉</p>`
              });

              if (error) {
                console.error('❌ Resend error:', error);
              } else {
                console.log('📧 Score email sent via Resend:', data.id);
              }
            } catch (emailErr) {
              console.error('❌ Resend send error:', emailErr.message);
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error('❌ Notification step failed:', notifyErr.message);
    }

    // --- Response ---
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
    console.error('❌ Error in submitExamResults:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};
