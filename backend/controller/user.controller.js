// D:\\Exam-portel\\backend\\controller\\user.controller.js
const UserServices = require('../services/user.services');
const { Question } = require('../models/question.model');
const mongoose = require('mongoose');
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const path = require('path');
const fs = require('fs');

// --- Register User ---
exports.register = async (req, res) => {
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

// --- Login with Mobile ---
exports.loginWithMobile = async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const { user, token } = await UserServices.loginWithMobile(mobile, password?.trim());
    return res.json({
      status: true,
      message: "Login successful",
      user,
      token
    });
  } catch (error) {
    console.error("Error in loginWithMobile controller:", error);
    const statusCode = error.message === "Invalid mobile number or password" ? 401 : 500;
    res.status(statusCode).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// --- Forgot Password ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 3600000;
    const user = await UserServices.setResetToken(email, token, expiration);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log(`Reset link: http://yourdomain.com/reset-password/${token}`);
    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

// --- Reset Password ---
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await UserServices.resetPassword(token, password?.trim());
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

// --- Get User Profile ---
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserServices.getUserById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.json({ status: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// --- Get User by Mobile ---
exports.getUserByMobile = async (req, res) => {
  try {
    const user = await UserServices.getUserByMobile(req.params.mobile);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by mobile:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

// --- Update Profile ---
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };
    delete updateData.profileImage;
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

// --- Get Profile Image ---
exports.getProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileImagePath = await UserServices.getProfileImage(userId);
    if (!profileImagePath) {
      return res.status(404).json({ status: false, message: "Profile image not found for this user." });
    }
    res.status(200).json({
      status: true,
      profileImage: profileImagePath,
      message: "Profile image path fetched successfully."
    });
  } catch (error) {
    console.error("Error in getProfileImage controller:", error);
    res.status(500).json({ status: false, message: error.message || "Failed to fetch profile image." });
  }
};

// --- Upload Profile Image ---
exports.uploadProfileImage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!req.file) {
      return res.status(400).json({ status: false, message: "No image file provided." });
    }
    const currentUser = await UserServices.getUserById(userId);
    if (!currentUser) {
      fs.unlink(req.file.path, err => err && console.error("Error deleting orphaned file:", err));
      return res.status(404).json({ status: false, message: "User not found." });
    }
    if (currentUser.profileImage && currentUser.profileImage !== "" && currentUser.profileImage !== "/default-profile.png") {
      const oldImagePath = path.join(__dirname, '..', 'public', currentUser.profileImage);
      fs.unlink(oldImagePath, err => err && console.error("Error deleting old profile image:", err));
    }
    const newProfileImagePath = `/uploads/${req.file.filename}`;
    const updatedUser = await UserServices.updateUser(userId, { profileImage: newProfileImagePath });
    if (!updatedUser) {
      fs.unlink(req.file.path, err => err && console.error("Error deleting orphaned new file:", err));
      return res.status(500).json({ status: false, message: "Failed to update user with new profile image." });
    }
    res.status(200).json({
      status: true,
      message: "Profile image uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in uploadProfileImage controller:", error);
    if (req.file) {
      fs.unlink(req.file.path, err => err && console.error("Error deleting problematic uploaded file:", err));
    }
    next(error);
  }
};

// --- Delete Profile Image ---
exports.deleteProfileImage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = await UserServices.getUserById(userId);
    if (!currentUser) {
      return res.status(404).json({ status: false, message: "User not found." });
    }
    if (currentUser.profileImage && currentUser.profileImage !== "" && currentUser.profileImage !== "/default-profile.png") {
      const oldImagePath = path.join(__dirname, '..', 'public', currentUser.profileImage);
      fs.unlink(oldImagePath, err => err && console.error("Error deleting old profile image file from disk:", err));
    }
    const updatedUser = await UserServices.deleteProfileImage(userId);
    if (!updatedUser) {
      return res.status(500).json({ status: false, message: "Failed to clear profile image in database." });
    }
    res.status(200).json({
      status: true,
      message: "Profile image deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in deleteProfileImage controller:", error);
    next(error);
  }
};

// --- Delete User ---
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userToDelete = await UserServices.getUserById(userId);
    if (userToDelete && userToDelete.profileImage && userToDelete.profileImage !== "" && userToDelete.profileImage !== "/default-profile.png") {
      const imagePath = path.join(__dirname, '..', 'public', userToDelete.profileImage);
      fs.unlink(imagePath, err => err && console.error("Error deleting user's profile image file during user deletion:", err));
    }
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

// --- Submit Exam Result ---
exports.submitExamResults = async (req, res) => {
  try {
    const { userId, category, section, set, duration, answers } = req.body;
    if (!userId || !category || !section || !set || typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
      console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
      return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format.' });
    }
    let calculatedScore = 0;
    let totalMarksPossible = 0;
    let correctAnswersCount = 0;
    let totalQuestionsCount = answers.length;

    const questionIds = answers.map(a => new mongoose.Types.ObjectId(a.questionId));
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map();
    questions.forEach(q => questionMap.set(q._id.toString(), q.marks));

    const processedAnswers = answers.map(a => {
      const marks = questionMap.get(a.questionId.toString());
      const isCorrect = a.isCorrect;
      const awarded = isCorrect ? marks : 0;
      if (isCorrect) correctAnswersCount++;
      calculatedScore += awarded;
      totalMarksPossible += marks;
      return { questionId: a.questionId, selectedOption: a.selectedOption, isCorrect, marksAwarded: awarded };
    });

    const newAttempt = await UserServices.saveExamResult({
      userId, category, section, set,
      score: calculatedScore,
      totalMarksPossible,
      totalQuestions: totalQuestionsCount,
      correctAnswers: correctAnswersCount,
      duration,
      answers: processedAnswers,
      submittedAt: new Date(),
    });

    res.status(201).json({
      message: 'Exam results submitted successfully!',
      examResult: {
        mongoId: newAttempt._id,
        score: newAttempt.score,
        totalMarksPossible: newAttempt.totalMarksPossible,
        totalQuestions: newAttempt.totalQuestions,
        correctAnswers: newAttempt.correctAnswers,
        duration: newAttempt.duration,
      }
    });
  } catch (error) {
    console.error('Error in submitExamResults controller:', error);
    res.status(500).json({ message: 'Internal server error during exam submission.', error: error.message });
  }
};

// --- Get Exam Review Details ---
exports.getExamReviewDetails = async (req, res) => {
  try {
    const { userId, examAttemptId } = req.params;
    console.log("Fetching exam review for:", userId, examAttemptId);

    const review = await UserServices.getExamReviewDetails(userId, examAttemptId);

    console.log("Review data:", review);
    res.status(200).json({ status: true, review });
  } catch (error) {
    console.error("Error in getExamReviewDetails controller:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.getExamHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await UserServices.getUserExamHistory(userId);
    res.status(200).json({ status: true, history });
  } catch (error) {
    console.error("Error in getExamHistory controller:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};