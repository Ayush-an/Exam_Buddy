// backend/services/user.services.js
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const JWT_SECRET = "yourSuperSecretKey123!";
const JWT_EXPIRE = "1h";
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

class UserServices {
  static async loginWithMobile(mobile, password) {
    try {
      const user = await UserModel.findOne({ mobile: String(mobile) });
      if (user) {
        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) throw new Error("Invalid mobile number or password");
      } else {
        throw new Error("Invalid mobile number or password");
      }
      const payload = { userId: user._id, mobile: user.mobile };
      const token = this.generateAccessToken(payload);
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return { user: userObj, token };
    } catch (error) {
      throw error;
    }
  }

  static async registerUser(userData) {
    try {
      let {
        firstName, lastName, mobile, parentMobile,
        whatsapp, email, dob, password,
        packagePurchased = "Free",
        planSubscription = null,
        profileImage = "",
      } = userData;
      password = password?.trim();
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
      const newUser = new UserModel({
        firstName, lastName, mobile, parentMobile,
        whatsapp, email, dob, password,
        packagePurchased, planSubscription,
        profileImage, score: 0, papersAttempted: 0,
        examHistory: [], isActive: true,
      });

      const savedUser = await newUser.save();
      const userObj = savedUser.toObject();
      delete userObj.password;
      return userObj;
    } catch (err) {
      throw err;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
      if ('profileImage' in updateData && (updateData.profileImage === null || updateData.profileImage === '')) {
        updateData.profileImage = '';
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

  static async deleteProfileImage(userId) {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { profileImage: "" } },
        { new: true }
      );
      if (!updatedUser) {
        throw new Error("User not found.");
      }
      const userObj = updatedUser.toObject();
      delete userObj.password;
      delete userObj.resetToken;
      delete userObj.resetTokenExpiration;
      return userObj;
    } catch (error) {
      throw new Error(`Failed to delete profile image: ${error.message}`);
    }
  }

  static async getProfileImage(userId) {
    try {
      const user = await UserModel.findById(userId).select('profileImage');
      if (!user) {
        throw new Error("User not found.");
      }
      return user.profileImage;
    } catch (error) {
      throw new Error(`Failed to get profile image: ${error.message}`);
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

  static async getExamReviewDetails(userId, attemptId) {
  try {
    // Try fetching from the ExamAttempt collection first
    let examAttempt = await ExamAttempt.findOne({
      _id: new ObjectId(attemptId),
      userId: new ObjectId(userId)
    }).populate('answers.questionId');

    if (examAttempt) return examAttempt;

    // Fallback: Fetch from User.examHistory array
    const user = await User.findOne(
      {
        _id: new ObjectId(userId),
        "examHistory._id": new ObjectId(attemptId)
      },
      { "examHistory.$": 1 }
    ).lean();

    if (!user || !user.examHistory || user.examHistory.length === 0) {
      throw new Error("Failed to get exam review details: Exam attempt not found in database");
    }

    const exam = user.examHistory[0];

    // Manually populate questionId for each answer
    const questionIds = exam.answers.map(a => new ObjectId(a.questionId));
    const questions = await mongoose.model('Question').find({
      _id: { $in: questionIds }
    }).lean();

    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    exam.answers = exam.answers.map(answer => ({
      ...answer,
      questionId: questionMap[answer.questionId.toString()] || null
    }));

    return exam;
  } catch (error) {
    console.error("Error in getExamReviewDetails:", error);
    throw error;
  }
}


  static async getUserExamHistory(userId) {
    try {
      const history = await ExamAttempt.find({ userId }).sort({ submittedAt: -1 });
      return history;
    } catch (error) {
      throw new Error("Failed to get exam history: " + error.message);
    }
  }

  static async setResetToken(email, token, expiration, mobile) {
  // Find user by email OR mobile
  const filter = email ? { email } : mobile ? { mobile } : null;
  if (!filter) return null;

  const user = await UserModel.findOneAndUpdate(
    filter,
    { resetToken: token, resetTokenExpiration: expiration },
    { new: true }
  );

  return user;
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

  static async saveExamResult({
    userId,
    category,
    section,
    set,
    score,
    totalMarksPossible,
    totalQuestions,
    correctAnswers,
    duration,
    answers,
  }) {
    try {
      const newExamAttempt = await ExamAttempt.create({
        examAttemptId: uuidv4(),
        userId,
        category,
        section,
        set,
        score,
        totalMarksPossible,
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