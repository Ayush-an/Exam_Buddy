const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Add this import

class UserServices {
  static async registerUser({
    firstName,
    lastName,
    mobile,
    parentMobile,
    email,
    dob,
    password,
    packagePurchased = "Free",
    planSubscription = null,
    profileImage = "",
  }) {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create and save the user
      const newUser = new UserModel({
        firstName,
        lastName,
        mobile,
        parentMobile,
        email,
        dob,
        password: hashedPassword,
        packagePurchased,
        planSubscription,
        profileImage,
        score: 0,
        papersAttempted: 0,
        examHistory: [],
        isActive: true,
      });

      return await newUser.save();
    } catch (err) {
      throw err;
    }
  }

  static async getUserByEmail(email) {
    try {
      return await UserModel.findOne({ email });
    } catch (err) {
      throw err;
    }
  }

  static async checkUser(email) {
    try {
      return await UserModel.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  static generateAccessToken(tokenData, JWTSecret_Key, JWT_EXPIRE) {
    // jwt.sign is synchronous without callback, so no need async
    return jwt.sign(tokenData, JWTSecret_Key, { expiresIn: JWT_EXPIRE });
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
      // or return null if you want silent failure
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;

    return await user.save();
  }
}

module.exports = UserServices;
