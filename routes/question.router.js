const express = require('express');
const router = express.Router();
const questionController = require('../controller/question.controller'); // ✅ fixed path

// ======= Question Paper Routes ======= //
router.get('/category', questionController.getAllQuestionPapers);
router.get('/category/:category', questionController.getQuestionPapersByCategory);
router.get('/category/:category/section/:sectionName', questionController.getSectionDetails);
router.post('/category', questionController.createOrUpdateQuestionPaper);
router.put('/category', questionController.createOrUpdateQuestionPaper);

// ======= Question Routes ======= //
router.post('/questions/create', questionController.createQuestion);
router.get('/questions', questionController.getAllQuestions);
router.get('/questions/:id', questionController.getQuestionById);
router.delete('/questions/:id', questionController.deleteQuestionById);

// ======= Section Routes ======= //
router.post('/sections/create', questionController.createSection);
router.get('/sections', questionController.getAllSections);
router.delete('/sections/:id', questionController.deleteSectionById);

module.exports = router;
