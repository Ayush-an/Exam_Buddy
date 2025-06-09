const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');

router.post("/register", UserController.register);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password/:token", UserController.resetPassword);
router.post('/login', UserController.loginWithMobile); // ✅ cleaner

router.get('/profile/mobile/:mobile', UserController.getUserByMobile);// View profile

router.get("/profile/:id", UserController.getUserProfile); // View profile
router.put("/update/:id", UserController.updateProfile);   // Update profile
router.delete("/delete/:id", UserController.deleteUser);   // Delete user

module.exports = router;
