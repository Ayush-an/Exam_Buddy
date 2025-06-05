const router = require("express").Router();
const UserController = require('../controller/user.controller');

router.post("/register", UserController.register); // ✔️ Route setup is correct
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password/:token", UserController.resetPassword);
    
module.exports = router;
