// D:\Exam-portel\backend\routes\question.router.js

const express = require('express');
const router = express.Router();
const questionController = require('../controller/question.controller');
const multer = require('multer');

// Configure Multer storage (keep this as is)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this directory exists!
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage }).any(); // Multer setup for all files

// --- Existing routes ---

router.get('/categories', questionController.fetchAllCategories);
router.get('/categories/:category/sections', questionController.fetchSectionsByCategory);
router.get('/test', (req, res) => {
    res.send('Test route from question router working!');
});
router.get('/categories/:category/sections/:section/sets', questionController.fetchSetsByCategorySection);

// Question Paper Routes
router.get('/question-papers', questionController.getAllQuestionPapers);
router.get('/question-papers/:category', questionController.getQuestionPapersByCategory);
router.get('/question-papers/:category/sections/:sectionName', questionController.getSectionDetails);
router.post('/question-papers', questionController.createOrUpdateQuestionPaper);
router.put('/question-papers', questionController.createOrUpdateQuestionPaper);

// Question Routes
router.post('/questions/create', upload, questionController.createQuestion);
router.get('/questions', questionController.getAllQuestions);
router.get('/questions/:id', questionController.getQuestionById);
router.delete('/questions/:id', questionController.deleteQuestionById);

// NEW ROUTE TO FETCH QUESTIONS BY CATEGORY, SECTION, AND SET
router.get('/questions/:category/:section/:set', questionController.getQuestionsBySet); // <--- ADD THIS LINE

// Set Routes
router.get('/question-papers/:category/sections/:sectionName/sets', questionController.getSets);
router.post('/question-papers/:category/sections/:sectionName/sets', questionController.addSet);
router.put('/question-papers/:category/sections/:sectionName/sets/:oldSetName', questionController.updateSet);
router.patch('/question-papers/:category/sections/:sectionName/sets/:setName/time-limit', questionController.updateSetTimeLimit);
router.delete('/question-papers/:category/sections/:sectionName/sets/:setName/time-limit', questionController.deleteSetTimeLimit);
router.delete('/question-papers/:category/sections/:sectionName/sets/:setName', questionController.deleteSet);

module.exports = router;
