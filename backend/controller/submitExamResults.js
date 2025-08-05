const mongoose = require('mongoose');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/user.model');
const { Question } = require('../models/question.model');

// This controller or service file
exports.submitExamResults = async (req, res) => {
  try {
    // Destructure expected fields from the request body & 'score' and 'totalQuestions' might be re-calculated or validated server-side.
    const { userId, category, section, set, duration, answers } = req.body;

    // Validation: Ensure all required fields are present and correctly formatted 
    if (!userId || !category || !section || !set ||
        typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
      console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
      return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
    }

    // Validate userId format if it's expected to be a Mongoose ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Validation error: Invalid userId format provided:', userId);
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // Server-side Calculation of Score and Total Marks Possible
    let calculatedScore = 0;
    let totalMarksPossible = 0;
    let correctAnswersCount = 0;
    let totalQuestionsCount = answers.length;

    // Extract all unique question IDs from the submitted answers
    const questionIds = answers.map(answer => mongoose.Types.ObjectId(answer.questionId));

    // Fetch all relevant questions from the database in one go for efficiency
    const questionsInExam = await Question.find({ '_id': { $in: questionIds } }).lean();

    // Create a map for quick lookup of question marks by ID
    const questionMarksMap = new Map();
    questionsInExam.forEach(q => {
      questionMarksMap.set(q._id.toString(), q.marks);
    });

    // Process each answer submitted by the user
    const processedAnswers = answers.map(answer => {
      const questionIdStr = answer.questionId.toString();
      const questionMarks = questionMarksMap.get(questionIdStr);

      if (questionMarks === undefined) {
        // This should ideally not happen if questionIds are valid, but good for robustness
        console.warn(`Question ID ${questionIdStr} not found in database during score calculation.`);
        return {
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: false,
          marksAwarded: 0 
        };
      }

      let marksAwardedForThisQuestion = 0;
      if (answer.isCorrect) {
        marksAwardedForThisQuestion = questionMarks;
        correctAnswersCount++;
      }

      calculatedScore += marksAwardedForThisQuestion;
      totalMarksPossible += questionMarks;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        marksAwarded: marksAwardedForThisQuestion
      };
    });

    // 1. Create a new ExamAttempt document
    const newExamAttempt = await ExamAttempt.create({
      userId,
      category,
      section,
      set,
      score: calculatedScore,
      totalMarksPossible: totalMarksPossible,
      totalQuestions: totalQuestionsCount,
      correctAnswers: correctAnswersCount,
      duration,
      answers: processedAnswers,
      submittedAt: new Date(),
    });

    console.log('Exam attempt saved successfully:', newExamAttempt._id);

    // 2. Optional: Link the exam attempt to the User's history
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { examHistory: newExamAttempt._id } }, // Push the MongoDB _id
        { new: true, upsert: false }
      );

      if (!updatedUser) {
        console.warn(`Warning: User with ID ${userId} not found when trying to link exam attempt ${newExamAttempt._id}.`);
      } else {
        console.log(`Exam attempt ${newExamAttempt._id} successfully linked to user ${userId}.`);
      }
    } catch (userUpdateError) {
      console.warn(`Warning: Could not link exam attempt ${newExamAttempt._id} to user ${userId} history:`, userUpdateError.message);
    }
    res.status(201).json({
      message: 'Exam results submitted successfully!',
      examResult: {
        mongoId: newExamAttempt._id, // Return the MongoDB ObjectId
        score: newExamAttempt.score,
        totalMarksPossible: newExamAttempt.totalMarksPossible,
        totalQuestions: newExamAttempt.totalQuestions,
        correctAnswers: newExamAttempt.correctAnswers,
        duration: newExamAttempt.duration,
      }
    });
  } catch (error) {
    console.error('Error in submitExamResults controller:', error);
    // This catch block handles other errors, like Mongoose schema validation errors
    res.status(500).json({ message: 'Internal server error during exam submission.', error: error.message });
  }
};