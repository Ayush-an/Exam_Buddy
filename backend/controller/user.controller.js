const UserServices = require('../services/user.services');
const ExamAttempt = require('../models/ExamAttempt'); // Assuming this path is correct, e.g., models/ExamAttempt.js
const User = require('../models/user.model');     // Adjusted path based on your input
const Question = require('../models/question.model'); // Adjusted path based on your input
const crypto = require("crypto");
const mongoose = require('mongoose'); // For ObjectId validation


exports.submitExamResults = async (req, res) => {
  try {
    const { userId, category, section, set, examAttemptId, score, totalQuestions, correctAnswers, duration, answers } = req.body;

    // --- Validation: Ensure all required fields are present and correctly formatted ---
    if (!userId || !category || !section || !set || !examAttemptId ||
        typeof score === 'undefined' || !totalQuestions || !correctAnswers ||
        typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
      console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
      return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
    }

    // Validate userId format if it's expected to be a Mongoose ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Validation error: Invalid userId format provided:', userId);
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // 1. Create a new ExamAttempt document
    const newExamAttempt = await ExamAttempt.create({
      userId,
      category,
      section,
      set,
      examAttemptId, // Unique identifier for this specific attempt from the frontend (e.g., ISO string)
      score,
      totalQuestions,
      correctAnswers,
      duration, // Duration in seconds
      answers,  // Array of { questionId, selectedOption, isCorrect }
      submittedAt: new Date(), // Capture submission time on the backend
    });

    console.log('Exam attempt saved successfully:', newExamAttempt._id);

    // 2. Optional: Link the exam attempt to the User's history
    // This assumes your User model has an 'examHistory' array field that stores ExamAttempt ObjectIds.
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { examHistory: newExamAttempt._id } }, // Push the MongoDB ObjectId of the new attempt
        { new: true, upsert: false } // 'upsert: true' is typically used if you want to create the user if not found. Here, we expect the user to exist.
      );

      if (!updatedUser) {
        console.warn(`Warning: User with ID ${userId} not found when trying to link exam attempt ${newExamAttempt._id}.`);
        // You might decide this is an error and return a 404/500 if linking is mandatory.
      } else {
        console.log(`Exam attempt ${newExamAttempt._id} successfully linked to user ${userId}.`);
      }
    } catch (userUpdateError) {
      console.warn(`Warning: Could not link exam attempt ${newExamAttempt._id} to user ${userId} history:`, userUpdateError.message);
      // This is a warning, as the ExamAttempt document itself was successfully created.
      // You might choose to make this an error depending on your application's requirements.
    }

    // Respond with success
    res.status(201).json({
      message: 'Exam results submitted successfully!',
      examResult: {
        examId: newExamAttempt.examAttemptId, // Return the client-provided `examAttemptId`
        score: newExamAttempt.score,
        totalQuestions: newExamAttempt.totalQuestions,
        correctAnswers: newExamAttempt.correctAnswers,
        duration: newExamAttempt.duration,
        mongoId: newExamAttempt._id // Also return the MongoDB ObjectId for future reference if needed
      }
    });

  } catch (error) {
    console.error('Error in submitExamResults controller:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Data validation failed during exam submission.', errors: messages });
    }
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ message: 'Duplicate exam ID detected. This exam might have already been submitted.' });
    }
    if (error.name === 'CastError') { // Mongoose casting error
      return res.status(400).json({ message: `Invalid data format for field '${error.path}'. Please check input types.`, error: error.message });
    }
    // Catch-all for any other unexpected errors
    res.status(500).json({ message: 'Internal Server Error during exam submission.', error: error.message });
  }
};


exports.register = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ status: false, message: "Request body is missing" });
    }
    const newUser = await UserServices.registerUser(req.body);
    return res.status(201).json({ status: true, success: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error("Error in register controller:", error);
    if (error.message === "User with this email already exists") {
      return res.status(409).json({ status: false, message: error.message });
    }
    return res.status(500).json({ status: false, message: error.message || 'Internal Server Error' });
  }
};

exports.loginWithMobile = async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const { user, token } = await UserServices.loginWithMobile(mobile, password);
    return res.json({
      status: true,
      message: "Login successful",
      user: user,
      token: token
    });
  } catch (error) {
    console.error("Error in loginWithMobile controller:", error);
    const statusCode = error.message === "Invalid mobile number or password" ? 401 : 500;
    res.status(statusCode).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 3600000; // 1 hour
    const user = await UserServices.setResetToken(email, token, expiration);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(`Reset link: http://yourdomain.com/reset-password/${token}`); // TODO: Send real email
    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await UserServices.resetPassword(token, password);
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserServices.getUserById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.json({ status: true, user: user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.getUserByMobile = async (req, res) => {
  try {
    const user = await UserServices.getUserByMobile(req.params.mobile);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by mobile:", error);
    res.status(error.status || 500).json({ message: error.message || "Internal Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await UserServices.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.json({ status: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ status: false, message: error.message || "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await UserServices.deleteUser(userId);
    if (!deletedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ status: false, message: error.message || "Failed to delete user" });
  }
};

// --- Controller for fetching exam review details ---
exports.getExamReviewDetails = async (req, res) => {
  const { userId, examAttemptId } = req.params;
  try {
    // Find the specific exam attempt using both userId and the client-provided examAttemptId
    const examEntry = await ExamAttempt.findOne({ userId: userId, examAttemptId: examAttemptId });

    if (!examEntry) {
      return res.status(404).json({ message: 'Exam attempt not found for review.' });
    }

    // Populate reviewData by fetching details for each question in the attempt's answers
    const reviewData = await Promise.all(examEntry.answers.map(async (ans) => {
      const questionDetails = await Question.findById(ans.questionId);
      if (!questionDetails) {
        // Log a warning if a question is not found (e.g., deleted from DB)
        console.warn(`Question with ID ${ans.questionId} not found for review in exam attempt ${examAttemptId}.`);
        // Return a placeholder for the missing question
        return {
          questionId: ans.questionId,
          userSelectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect,
          questionText: 'Question not found (may have been deleted)',
          options: [],
          correctAnswer: 'N/A'
        };
      }
      return {
        _id: questionDetails._id,
        questionText: questionDetails.questionText,
        questionImage: questionDetails.questionImage,
        questionAudio: questionDetails.questionAudio,
        options: questionDetails.options, // Full options array from Question model
        correctAnswer: questionDetails.correctAnswer, // Correct answer from Question model
        userSelectedOption: ans.selectedOption, // User's selected option for this attempt
        isCorrect: ans.isCorrect // Whether user's answer was correct for this attempt
      };
    }));

    res.status(200).json({ examEntry, reviewData });
  } catch (error) {
    console.error('Error in getExamReviewDetails controller:', error);
    res.status(500).json({ message: 'Failed to fetch exam review details', error: error.message || 'Internal Server Error' });
  }
};