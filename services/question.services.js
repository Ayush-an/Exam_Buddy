const { Question, QuestionPaper } = require('../models/question.model');

/**
 * Validates if a section exists within a category and if the set belongs to that section.
 * @param {string} category
 * @param {string} sectionName
 * @param {string} setName
 * @returns {Promise<boolean>} true if valid, false otherwise
 */
async function validateSectionAndSet(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) return false;

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) return false;

    // If the section has sets defined, the setName must be one of them.
    if (section.sets && section.sets.length > 0) {
      return section.sets.includes(setName);
    } else {
      // If no sets defined, only accept empty or null setName
      return !setName;
    }
  } catch (error) {
    console.error('Error validating section and set:', error);
    return false;
  }
}

// QuestionPaper Services

async function getAllQuestionPapers() {
  try {
    return await QuestionPaper.find({});
  } catch (error) {
    console.error('Error fetching all question papers:', error);
    throw error;
  }
}

async function getQuestionPapersByCategory(category) {
  try {
    return await QuestionPaper.findOne({ category });
  } catch (error) {
    console.error(`Error fetching question paper for category "${category}":`, error);
    throw error;
  }
}

async function getSectionDetails(category, sectionName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    return paper?.sections.find(section => section.name === sectionName) || null;
  } catch (error) {
    console.error(`Error getting section "${sectionName}" from category "${category}":`, error);
    throw error;
  }
}

async function createOrUpdateQuestionPaper(category, sections) {
  try {
    return await QuestionPaper.findOneAndUpdate(
      { category },
      { $set: { sections } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    console.error(`Error creating/updating question paper for category "${category}":`, error);
    throw error;
  }
}

// Question Services

async function createQuestion(questionData) {
  try {
    const { category, section, set } = questionData;

    const isValid = await validateSectionAndSet(category, section, set);
    if (!isValid) {
      throw new Error(`Invalid section "${section}" or set "${set}" for category "${category}"`);
    }

    const question = new Question(questionData);
    return await question.save();
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

async function getAllQuestions() {
  try {
    return await Question.find();
  } catch (error) {
    console.error('Error fetching all questions:', error);
    throw error;
  }
}

async function getQuestionById(id) {
  try {
    return await Question.findById(id);
  } catch (error) {
    console.error(`Error fetching question by ID "${id}":`, error);
    throw error;
  }
}

async function deleteQuestionById(id) {
  try {
    return await Question.findByIdAndDelete(id);
  } catch (error) {
    console.error(`Error deleting question by ID "${id}":`, error);
    throw error;
  }
}

module.exports = {
  // QuestionPaper services
  getAllQuestionPapers,
  getQuestionPapersByCategory,
  getSectionDetails,
  createOrUpdateQuestionPaper,

  // Question services
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById
};
