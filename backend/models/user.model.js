// backend/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    firstName: { type: String, required: [true, "First name can't be empty"] },
    lastName: { type: String, required: [true, "Last name can't be empty"] },
    mobile: { type: String, required: [true, "Mobile number is required"] },
    parentMobile: { type: String },
    whatsapp: { type: String },
    email: { type: String, required: [true, "Email is required"], unique: true },
    dob: { type: Date, required: [true, "DOB is required"] },
    password: { type: String, required: [true, "Password is required"] },
    score: { type: Number, default: 0 },
    papersAttempted: { type: Number, default: 0 },
    packagePurchased: { type: String, default: 'Free' },
    planSubscription: {
      type: {
        planName: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
      },
      default: null,
    },
    subscriptions: [{
      planName: String,
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ['active', 'expired'], default: 'active' },
      purchasedAt: { type: Date, default: Date.now }
    }],
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
    examHistory: [{
       _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    examPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper' },
      category: { type: String },
      section: { type: String },
      set: { type: String },
    answers: [mongoose.Schema.Types.Mixed],
      score: Number,
      totalQuestions: Number,
      correctAnswers: Number,
      duration: Number,
      submittedAt: { type: Date, default: Date.now }
    }],
    profileImage: { type: String , default: ""},
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Password hashing before saving the user document
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash; // Store the hashed password
    next();
  } catch (err) {
    next(err); // Pass any errors to the next middleware
  }
});

// Method to compare candidate password with the hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Static method for user login using mobile number and password
userSchema.statics.loginWithMobile = async function (mobile, password) {
  const user = await this.findOne({ mobile });
  if (!user) throw new Error('Invalid mobile number or password');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid mobile number or password');
  return user;
};

// Static method to update a user by their ID
userSchema.statics.updateUserById = async function (id, updateData) {
  try {
    const user = await this.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return user;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Static method to delete a user by their ID
userSchema.statics.deleteUserById = async function (id) {
  try {
    const result = await this.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

// Static method to get a user by their ID
userSchema.statics.getUserById = async function (id) {
  try {
    return await this.findById(id);
  } catch (error) {
    throw new Error(`User not found: ${error.message}`);
  }
};

// Static method to get a user by their mobile number
userSchema.statics.getUserByMobile = async function (mobile) {
  try {
    const user = await this.findOne({ mobile });
    if (!user) throw new Error('User not found with this mobile number');
    return user;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

// Static method to update a user by their mobile number
userSchema.statics.updateUserByMobile = async function (mobile, updateData) {
  try {
    const user = await this.findOneAndUpdate(
      { mobile },
      updateData,
      { new: true, runValidators: true }
    );
    if (!user) throw new Error('User not found with this mobile number');
    return user;
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};
const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;