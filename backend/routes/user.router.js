const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');
const upload = require('../middleware/upload');

// User Authentication and Management
router.post('/register', UserController.register);
router.post('/login', UserController.loginWithMobile);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password/:token', UserController.resetPassword);

// User Profile Management
router.get('/users/:id', UserController.getUserProfile);
router.get('/users/mobile/:mobile', UserController.getUserByMobile);

// IMPORTANT: For updating user data *excluding* profile image
router.patch('/users/:id', UserController.updateProfile);
router.post('/users/:userId/profile-image', upload, UserController.uploadProfileImage);
// Route for deleting profile image
router.delete('/users/:userId/profile-image', UserController.deleteProfileImage);
//get profile image
router.get('/users/:userId/profile-image', UserController.getProfileImage);

// Delete User (consider adding authorization/admin check here)
router.delete('/users/:id', UserController.deleteUser);

// Exam Related
router.post('/submit-exam-results', UserController.submitExamResults);
router.get('/exam-review/:userId/:examAttemptId', UserController.getExamReviewDetails);
router.get('/exam-history/:userId', UserController.getExamHistory);
module.exports = router;