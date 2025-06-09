const UserServices = require('../services/user.services');
const crypto = require("crypto");

exports.register = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ status: false, message: "Request body is missing" });
    }

    const {
      firstName,
      lastName,
      mobile,
      parentMobile,
      whatsapp,
      email,
      dob,
      password,
    } = req.body;

    await UserServices.registerUser({
      firstName,
      lastName,
      mobile,
      parentMobile,
      whatsapp,
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

exports.loginWithMobile = async (req, res) => {
  const { mobile, password } = req.body;

  try {
   const user = await User.findOne({ mobile });

if (user && user.password === password) {
  return res.json({
    status: true,
    message: "Login successful",
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      email: user.email,
      dob: user.dob,
      whatsapp: user.whatsapp
    }
  });
}
  } catch (error) {
    res.status(401).json({ status: false, error: error.message });
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

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserServices.getUserById(userId);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const { password, resetToken, resetTokenExpiration, ...userData } = user.toObject();

    res.json({ status: true, user: userData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
// user.controller.js
exports.getUserByMobile = async (req, res) => {
  try {
    const user = await UserServices.getUserByMobile(req.params.mobile);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by mobile:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const updatedUser = await UserServices.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const { password, resetToken, resetTokenExpiration, ...userData } = updatedUser.toObject();

    res.json({ status: true, message: "User updated successfully", user: userData });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ status: false, message: error.message || "Failed to update user" });
  }
};

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
