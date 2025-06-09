const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose'); // Import mongoose to get the Question model
// Hardcoded JWT secret and expiry (change these as needed)
const JWT_SECRET = "yourSuperSecretKey123!";  // <-- Replace with your own secret
const JWT_EXPIRE = "1h"; // e.g. "1h", "2d", "30m"
class UserServices {
 // Login: validate mobile + password, return user + token
 static async loginWithMobile(mobile, password) {
 try {
 const user = await UserModel.findOne({ mobile });
 if (!user) throw new Error("Invalid mobile number or password");
 const isMatch = await bcrypt.compare(password, user.password);
 if (!isMatch) throw new Error("Invalid mobile number or password");
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
 static async registerUser({
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
 }) {
 try {
 const existingUser = await UserModel.findOne({ email });
 if (existingUser) {
 throw new Error("User with this email already exists");
 }
 const salt = await bcrypt.genSalt(10);
 const hashedPassword = await bcrypt.hash(password, salt);
 const newUser = new UserModel({
 firstName,
lastName,
 mobile,
 parentMobile,
 whatsapp,
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
 // New method: Record exam result
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
 static async getExamReviewDetails(userId, examAttemptId) {
 try {
 const user = await UserModel.findById(userId);
 if (!user) throw new Error('User not found');
 // Find the specific exam entry by examId within the user's history
 const examEntry = user.examHistory.find(entry => String(entry.examId) === String(examAttemptId));
 if (!examEntry) throw new Error('Exam attempt not found in history');
// Extract questionIds from the answers array in the exam entry
 const questionIds = examEntry.answers.map(answer => answer.questionId);

 // Get the Question model dynamically to fetch full question details
 const QuestionModel = mongoose.model('Question');
 const questions = await QuestionModel.find({ _id: { $in: questionIds } });
 // Combine original questions with user's answers for review
 const reviewData = questions.map(q => {
 const userAnswerEntry = examEntry.answers.find(ans => String(ans.questionId) === String(q._id));
 return {
 ...q.toObject(), // Convert Mongoose document to plain object
userSelectedOption: userAnswerEntry?.selectedOption || null,
 isUserCorrect: userAnswerEntry?.isCorrect || false
 };
 });
 return { examEntry, reviewData }; // Return both summary and detailed review
 } catch (error) {
 throw new Error(`Failed to get exam review details: ${error.message}`);
 }
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

}

module.exports = UserServices;
