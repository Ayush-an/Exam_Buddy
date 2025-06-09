const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');

router.post("/register", UserController.register);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password/:token", UserController.resetPassword);
router.post('/login', UserController.loginWithMobile);
router.post('/exam-history', UserController.submitExamResults); // Correctly mapped
router.get('/exam-history/:userId/:examAttemptId', UserController.getExamReviewDetails); // Correctly mapped



router.get('/profile/mobile/:mobile', UserController.getUserByMobile);
router.get("/profile/:id", UserController.getUserProfile);
router.put("/update/:id", UserController.updateProfile);
router.delete("/delete/:id", UserController.deleteUser);

// --- New routes for Exam History ---
router.post('/exam-history', UserController.submitExamResults);
// Route to get review details: includes userId for security/scoping
router.get('/exam-history/:userId/:examAttemptId', UserController.getExamReviewDetails);

module.exports = router;
