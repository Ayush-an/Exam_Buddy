const mongoose = require('mongoose'); // import mongoose package
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: [true, "First name can't be empty"] },
    lastName: { type: String, required: [true, "Last name can't be empty"] },
    mobile: { type: String, required: [true, "Mobile number is required"] },
    parentMobile: { type: String },
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
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },

    examHistory: [{
      examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
      score: Number,
      date: Date
    }],
    profileImage: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Password hashing before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
