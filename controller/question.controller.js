const questionServices = require('../services/question.services');
const Question = require('../models/question.model').Question;

/**
 * Get all question paper categories and their sections.
 */
async function getAllQuestionPapers(req, res) {
  try {
    const questionPapers = await questionServices.getAllQuestionPapers();
    res.status(200).json(questionPapers);
  } catch (error) {
    console.error('Error getting all question papers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get question papers for a specific category.
 */
async function getQuestionPapersByCategory(req, res) {
  const { category } = req.params;
  try {
    const questionPaper = await questionServices.getQuestionPapersByCategory(category);
    if (!questionPaper) {
      return res.status(404).json({ message: `Category '${category}' not found.` });
    }
    res.status(200).json(questionPaper);
  } catch (error) {
    console.error(`Error getting question papers for category ${category}:`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get details for a specific section within a category.
 */
async function getSectionDetails(req, res) {
  const { category, sectionName } = req.params;
  try {
    const sectionDetails = await questionServices.getSectionDetails(category, sectionName);
    if (!sectionDetails) {
      return res.status(404).json({ message: `Section '${sectionName}' not found in category '${category}'.` });
    }
    res.status(200).json(sectionDetails);
  } catch (error) {
    console.error(`Error getting section '${sectionName}' in category '${category}':`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Add these functions if you haven't defined them already

const createSection = async (req, res) => {
  // Your implementation here
  res.status(200).json({ message: "Section created successfully" });
};

const getAllSections = async (req, res) => {
  // Your implementation here
  res.status(200).json({ sections: [] });
};

const deleteSectionById = async (req, res) => {
  // Your implementation here
  res.status(200).json({ message: "Section deleted" });
};


/**
 * Create or update a question paper category with sections.
 */
async function createOrUpdateQuestionPaper(req, res) {
  const { category, sections } = req.body;
  if (!category || !Array.isArray(sections)) {
    return res.status(400).json({ message: 'Category and an array of sections are required.' });
  }
  try {
    const updatedQuestionPaper = await questionServices.createOrUpdateQuestionPaper(category, sections);
    res.status(201).json(updatedQuestionPaper);
  } catch (error) {
    console.error('Error creating/updating question paper:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Create a new question.
 */
async function createQuestion(req, res) {
  try {
    const questionData = req.body;

    // Validate timer
    const { timer } = questionData;
    if (timer !== undefined && (timer < 10 || timer > 300)) {
      return res.status(400).json({ message: 'Timer must be between 10 and 300 seconds.' });
    }

    // Basic field validation
    const requiredFields = ['category', 'section', 'set', 'questionText', 'options', 'correctAnswer'];
    for (const field of requiredFields) {
      if (!questionData[field]) {
        return res.status(400).json({ message: `Field "${field}" is required.` });
      }
    }

    const question = await questionServices.createQuestion(questionData);
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    if (error.message && error.message.startsWith('Invalid section')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get all questions.
 */
async function getAllQuestions(req, res) {
  try {
    const questions = await questionServices.getAllQuestions();
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get question by ID.
 */
async function getQuestionById(req, res) {
  const { id } = req.params;
  try {
    const question = await questionServices.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ message: `Question with id ${id} not found.` });
    }
    res.status(200).json(question);
  } catch (error) {
    console.error(`Error getting question with id ${id}:`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Delete question by ID.
 */
async function deleteQuestionById(req, res) {
  const { id } = req.params;
  try {
    const deleted = await questionServices.deleteQuestionById(id);
    if (!deleted) {
      return res.status(404).json({ message: `Question with id ${id} not found.` });
    }
    res.status(200).json({ message: `Question with id ${id} deleted.` });
  } catch (error) {
    console.error(`Error deleting question with id ${id}:`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

module.exports = {
   getAllQuestionPapers,
  getQuestionPapersByCategory,
  getSectionDetails,
  createOrUpdateQuestionPaper,
  createQuestion, // ✅ must be present
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  createSection,           // ✅ if you're using these
  getAllSections,
  deleteSectionById

};
