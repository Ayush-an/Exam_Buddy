
const mongoose = require('mongoose');
const ExamAttempt = require('../models/ExamAttempt'); // ✅ Adjust path as needed
const User = require('../models/user.model'); // ✅ Also needed for linking exam history


// This looks like it's from a controller or service file, e.g., user.controller.js
exports.submitExamResults = async (req, res) => {
    try {
        // Destructure only the fields you expect and need from the request body
        const { userId, category, section, set, score, totalQuestions, correctAnswers, duration, answers } = req.body;

        // --- Validation: Ensure all required fields are present and correctly formatted ---
        // REMOVE 'examAttemptId' from this check
        if (!userId || !category || !section || !set ||
            typeof score === 'undefined' || !totalQuestions || !correctAnswers ||
            typeof duration === 'undefined' || !Array.isArray(answers) || answers.length === 0) {
            console.error('Validation error: Missing or invalid required fields for exam attempt submission.');
            return res.status(400).json({ message: 'Missing or invalid required exam attempt data.' });
        }

        // Validate userId format if it's expected to be a Mongoose ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Validation error: Invalid userId format provided:', userId);
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        // 1. Create a new ExamAttempt document
        const newExamAttempt = await ExamAttempt.create({
            userId,
            category,
            section,
            set,
            score,
            totalQuestions,
            correctAnswers,
            duration,
            answers,
            submittedAt: new Date(),
        });

        console.log('Exam attempt saved successfully:', newExamAttempt._id);

        // 2. Optional: Link the exam attempt to the User's history
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $push: { examHistory: newExamAttempt._id } }, // Push the MongoDB _id
                { new: true, upsert: false }
            );

            if (!updatedUser) {
                console.warn(`Warning: User with ID ${userId} not found when trying to link exam attempt ${newExamAttempt._id}.`);
            } else {
                console.log(`Exam attempt ${newExamAttempt._id} successfully linked to user ${userId}.`);
            }
        } catch (userUpdateError) {
            console.warn(`Warning: Could not link exam attempt ${newExamAttempt._id} to user ${userId} history:`, userUpdateError.message);
        }

        // Respond with success
        res.status(201).json({
            message: 'Exam results submitted successfully!',
            examResult: {
                mongoId: newExamAttempt._id, // Return the MongoDB ObjectId
                score: newExamAttempt.score,
                totalQuestions: newExamAttempt.totalQuestions,
                correctAnswers: newExamAttempt.correctAnswers,
                duration: newExamAttempt.duration,
            }
        });

    } catch (error) {
        console.error('Error in submitExamResults controller:', error);
        // This catch block handles other errors, like Mongoose schema validation errors
        // or unexpected server issues, typically returning a 500.
        // For production, you might want more granular error messages for specific schema issues.
        res.status(500).json({ message: 'Internal server error during exam submission.', error: error.message });
    }
};