const UserServices = require('../services/user.services');
const crypto = require("crypto");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

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
    const expiration = Date.now() + 3600000; // 1 hour
    const user = await UserServices.setResetToken(email, token, expiration);
    if (!user) return res.status(404).json({ message: "User not found" });

    // TODO: send email here
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

// --- Delete User ---
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

// --- Submit Exam Result ---
exports.submitExamResults = async (req, res) => {
  try {
    const {
      userId, category, section, set, score,
      totalQuestions, correctAnswers, duration, answers
    } = req.body;

    const newExamAttempt = await UserServices.saveExamResult({
      userId, category, section, set, score,
      totalQuestions, correctAnswers, duration, answers
    });

    res.status(201).json({
      message: 'Exam results submitted successfully!',
      examResult: {
        mongoId: newExamAttempt._id,
        score: newExamAttempt.score,
        totalQuestions: newExamAttempt.totalQuestions,
        correctAnswers: newExamAttempt.correctAnswers,
        duration: newExamAttempt.duration,
      }
    });
  } catch (error) {
    console.error('Error in submitExamResults controller:', error);
    res.status(500).json({ message: 'Internal server error during exam submission.', error: error.message });
  }
};

// --- Exam Review Details ---
exports.getExamReviewDetails = async (req, res) => {
  try {
    const { userId, examAttemptId } = req.params;
    const reviewData = await UserServices.getExamReviewDetails(userId, examAttemptId);
    res.status(200).json(reviewData);
  } catch (error) {
    console.error("Error in getExamReviewDetails controller:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};
