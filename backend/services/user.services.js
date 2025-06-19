const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const JWT_SECRET = "yourSuperSecretKey123!";   // <-- Replace with your own secret
const JWT_EXPIRE = "1h"; // e.g. "1h", "2d", "30m"
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/user.model'); // adjust if needed
const { v4: uuidv4 } = require('uuid');

class UserServices {
  // Login: validate mobile + password, return user + token
  static async loginWithMobile(mobile, password) {
    try {
      const user = await UserModel.findOne({ mobile: String(mobile) });
      console.log("Login attempt for mobile:", mobile);
      console.log("User found:", user);
      console.log("Entered password (trimmed):", password.trim());
      // console.log("Stored hash:", user.password); // Be careful logging sensitive data
      if (user) {
        console.log("Entered password:", password);
        // console.log("Stored hash:", user.password); // Be careful logging sensitive data
        const isMatch = await bcrypt.compare(password.trim(), user.password);

        console.log("Password match result:", isMatch);
        if (!isMatch) throw new Error("Invalid mobile number or password");
      } else {
        throw new Error("Invalid mobile number or password"); // User not found
      }
      // Create JWT payload and token
      const payload = { userId: user._id, mobile: user.mobile };
      const token = this.generateAccessToken(payload);
      // Exclude sensitive info before returning
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return { user: userObj, token };
    } catch (error) {
      throw error;
    }
  }
  // Register user: hash password explicitly before saving
  static async registerUser(userData) {
    try {
      let {
        firstName,
        lastName,
        mobile,
        parentMobile,
        whatsapp,
        email,
        dob,
        password,
        packagePurchased = "Free",
        planSubscription = null,
        profileImage = "",
      } = userData;

      password = password?.trim(); // ✅ Safe trimming

      console.log("Registering user with password length:", password.length); // Log length, not content

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
      const newUser = new UserModel({
        firstName,
        lastName,
        mobile,
        parentMobile,
        whatsapp,
        email,
        dob,
        password: password, // The pre-save hook in user.model.js will hash it
        packagePurchased,
        planSubscription,
        profileImage,
        score: 0,
        papersAttempted: 0,
        examHistory: [],
        isActive: true,
      });

      const savedUser = await newUser.save();
      const userObj = savedUser.toObject();
      delete userObj.password;

      return userObj;
    } catch (err) {
      throw err;
    }
  }

  // Update user, hash password if provided
  static async updateUser(userId, updateData) {
    try {
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedUser) throw new Error("User not found");
      const userObj = updatedUser.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
  static async deleteUser(userId) {
    try {
      const result = await UserModel.findByIdAndDelete(userId);
      if (!result) throw new Error("User not found");
      return result;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
  static async getUserById(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("User not found");
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  static async getUserByEmail(email) {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) return null;
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return userObj;
    } catch (err) {
      throw err;
    }
  }
  static async getUserByMobile(mobile) {
    try {
      const user = await UserModel.findOne({ mobile });
      if (!user) throw new Error("User not found with this mobile number");
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to get user by mobile: ${error.message}`);
    }
  }
  // New method: Record exam result (this function is likely deprecated by saveExamResult)
  static async recordExamResult(userId, {
    examId,
    category, // Added for storing context in examHistory
    section,// Added for storing context in examHistory
    set, // Added for storing context in examHistory
    submittedAnswers,
    calculatedScore,
    totalQ,
    correctCount,
    timeTaken,
    submittedAt
  }) {
    try {
      const updated = await UserModel.findByIdAndUpdate(userId, {
        $push: {
          examHistory: {
            examId,
            category, // Store category
            section,// Store section
            set, // Store set
            answers: submittedAnswers,
            score: calculatedScore,
            totalQuestions: totalQ,
            correctAnswers: correctCount,
            duration: timeTaken,
            submittedAt: submittedAt || new Date()
          }
        },
        $inc: { papersAttempted: 1, score: calculatedScore }
      }, { new: true });
      if (!updated) throw new Error("User not found");
      return updated;
    } catch (error) {
      throw new Error(`Failed to record exam result: ${error.message}`);
    }
  }
  // New method: Get exam review details

  static async getExamReviewDetails(userId, attemptId) {
    const examAttempt = await ExamAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),   // ✅ Convert to ObjectId
      userId: new mongoose.Types.ObjectId(userId)
      // ✅ Also convert userId
    }).populate('answers.questionId');


    if (!examAttempt) {
      throw new Error("Failed to get exam review details: Exam attempt not found in database");
    }

    return examAttempt;
  }
  static async setResetToken(email, token, expiration) {
    return await UserModel.findOneAndUpdate(
      { email },
      { resetToken: token, resetTokenExpiration: expiration },
      { new: true }
    );
  }
  static async resetPassword(token, newPassword) {
    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error("Invalid or expired reset token");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    return await user.save();
  }
  static generateAccessToken(tokenData) {
    return jwt.sign(tokenData, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  }

  /**
   * Saves a new exam attempt result to the database.
   * Also links the attempt to the user's exam history.
   *
   * @param {Object} examAttemptData - The data for the exam attempt,
   * including userId, category, section, set, score, totalMarksPossible,
   * totalQuestions, correctAnswers, duration, and processed answers.
   * @returns {Promise<Document>} The created ExamAttempt document.
   * @throws {Error} If validation fails or there's a database error.
   */
  static async saveExamResult({
    userId,
    category,
    section,
    set,
    score,
    totalMarksPossible, // <--- NOW INCLUDED IN DESTRUCTURED PARAMETERS
    totalQuestions,
    correctAnswers,
    duration,
    answers,
  }) {
    try {
      // --- START DEBUGGING LOGS (keep for now, remove after successful test) ---
      console.log("--- UserServices.saveExamResult: Incoming examAttemptData ---");
      console.log("userId:", userId);
      console.log("category:", category);
      console.log("section:", section);
      console.log("set:", set);
      console.log("score:", score, " (Type:", typeof score, ")");
      console.log("totalMarksPossible:", totalMarksPossible, " (Type:", typeof totalMarksPossible, ")");
      console.log("totalQuestions:", totalQuestions, " (Type:", typeof totalQuestions, ")");
      console.log("correctAnswers:", correctAnswers, " (Type:", typeof correctAnswers, ")");
      console.log("duration:", duration, " (Type:", typeof duration, ")");
      console.log("answers (first 2):", answers.slice(0, 2)); // Log first few answers
      console.log("--- END DEBUGGING LOGS ---");

      // Validate essential numeric fields just before creating the document
      // These checks are for safety, but primary validation should pass earlier.
      if (typeof score !== 'number' || isNaN(score)) {
        throw new Error(`Invalid score value: ${score}`);
      }
      if (typeof totalMarksPossible !== 'number' || isNaN(totalMarksPossible)) {
        throw new Error(`Invalid totalMarksPossible value: ${totalMarksPossible}`);
      }
      if (typeof totalQuestions !== 'number' || isNaN(totalQuestions)) {
        throw new Error(`Invalid totalQuestions value: ${totalQuestions}`);
      }
      if (typeof correctAnswers !== 'number' || isNaN(correctAnswers)) {
        throw new Error(`Invalid correctAnswers value: ${correctAnswers}`);
      }
      if (typeof duration !== 'number' || isNaN(duration)) {
          throw new Error(`Invalid duration value: ${duration}`);
      }

      const newExamAttempt = await ExamAttempt.create({
        examAttemptId: uuidv4(),
        userId,
        category,
        section,
        set,
        score,
        totalMarksPossible, // <--- NOW USED HERE
        totalQuestions,
        correctAnswers,
        duration,
        answers,
        submittedAt: new Date(),
      });

      await User.findByIdAndUpdate(
        userId,
        { $push: { examHistory: newExamAttempt._id } },
        { new: true, upsert: false }
      );

      return newExamAttempt;
    } catch (error) {
      console.error("Error saving exam attempt:", error);
      throw new Error("Failed to save exam result: " + error.message);
    }
  }
}


module.exports = UserServices;
