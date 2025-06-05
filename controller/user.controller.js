const UserServices = require('../services/user.services');
const crypto = require("crypto");

exports.register = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ status: false, message: "Request body is missing" });
    }

    const { firstName, lastName, mobile, email, dob, password } = req.body;

    await UserServices.registerUser({
      firstName,
      lastName,
      mobile,
      email,
      dob,
      password,
    });

    return res.json({ status: true, success: 'User registered successfully' });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ status: false, message: error.message || 'Internal Server Error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 3600000; // 1 hour

    const user = await UserServices.setResetToken(email, token, expiration);
    if (!user) return res.status(404).json({ message: "User not found" });

    // TODO: Send token via email (e.g., with nodemailer)
    console.log(`Reset link: http://yourdomain.com/reset-password/${token}`);

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await UserServices.resetPassword(token, password);
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
