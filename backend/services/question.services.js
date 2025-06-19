// D:\Exam-portel\backend\services\question.services.js

const { Question, QuestionPaper } = require('../models/question.model');
const mongoose = require('mongoose');

// --- Question Services ---

/**
 * Creates a new question in the database.
 * Includes validation to ensure the question's category, section, and set are valid.
 * @param {Object} questionData - Data for the new question, including 'marks'.
 * @returns {Promise<Document>} The saved question document.
 * @throws {Error} If validation fails or there's a database error.
 */
async function createQuestion(questionData) {
  try {
    const { category, section, set, marks } = questionData; // Destructure marks
    const isValid = await validateSectionAndSet(category, section, set); // Use internal validation helper
    if (!isValid) {
      throw new Error(`Invalid section "${section}" or set "${set}" for category "${category}". Please ensure the set exists.`);
    }

    // Additional validation for marks
    if (typeof marks !== 'number' || isNaN(marks) || marks < 0) {
      throw new Error('Marks must be a non-negative number.');
    }

    const question = new Question(questionData);
    return await question.save();
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

/**
 * Get all questions for a specific category, section, and set.
 * This is used by the frontend to fetch questions for an exam.
 * @param {string} category - The category of the questions.
 * @param {string} section - The section of the questions.
 * @param {string} set - The set name within the section.
 * @returns {Promise<Array>} Array of question objects.
 * @throws {Error} If categories, section, or set are missing, or a database error occurs.
 */
async function getQuestionsBySet(category, section, set) {
  if (!category || !section || !set) {
    throw new Error("Category, section, and set are required to fetch questions.");
  }
  try {
    // Find questions that match all three criteria
    const questions = await Question.find({ category, section, set }).lean();
    return questions;
  } catch (error) {
    console.error(`Error fetching questions for category "${category}", section "${section}", set "${set}":`, error);
    throw error;
  }
}

/**
 * Fetches all questions from the database.
 * @returns {Promise<Array>} Array of all question documents.
 * @throws {Error} If a database error occurs.
 */
async function getAllQuestions() {
  try {
    return await Question.find().lean();
  }
  catch (error) {
    console.error('Error fetching all questions:', error);
    throw error;
  }
}

/**
 * Fetches a single question by its ID.
 * @param {string} id - The MongoDB ObjectId of the question.
 * @returns {Promise<Document|null>} The question document or null if not found.
 * @throws {Error} If a database error occurs.
 */
async function getQuestionById(id) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Question ID format.");
    }
    return await Question.findById(id).lean();
  } catch (error) {
    console.error(`Error fetching question by ID "${id}":`, error);
    throw error;
  }
}

/**
 * Deletes a question by its ID.
 * @param {string} id - The MongoDB ObjectId of the question to delete.
 * @returns {Promise<Document|null>} The deleted question document or null if not found.
 * @throws {Error} If a database error occurs.
 */
async function deleteQuestionById(id) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid Question ID format for deletion.");
    }
    return await Question.findByIdAndDelete(id).lean();
  } catch (error) {
    console.error(`Error deleting question by ID "${id}":`, error);
    throw error;
  }
}

// --- Internal Validation Helper for Questions/Sets ---
/**
 * Validates if a section exists within a category and if the set belongs to that section.
 * This is an internal helper used for creating/updating questions and sets.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {string} setName - The set name.
 * @returns {Promise<boolean>} True if the combination of category, section, and set is valid; otherwise, false.
 */
async function validateSectionAndSet(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category: category }).lean();
    if (!paper) {
      return false;
    }

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) {
      return false;
    }

    // Check if the provided set name exists within the found section's sets
    if (!section.sets || section.sets.length === 0) {
      return false;
    }
    const setExists = section.sets.some(s => s.name === setName);
    return setExists;
  } catch (error) {
    console.error('Error in validateSectionAndSet:', error);
    return false;
  }
}

// ======================= Question Paper Management Services ==========================

/**
 * Fetches all question papers.
 * @returns {Promise<Array>} Array of QuestionPaper documents.
 * @throws {Error} If a database error occurs.
 */
async function getAllQuestionPapers() {
  try {
    return await QuestionPaper.find({}).lean();
  } catch (error) {
    console.error('Error fetching all question papers:', error);
    throw error;
  }
}

/**
 * Fetches a single question paper by category.
 * @param {string} category - The category of the question paper.
 * @returns {Promise<Document|null>} The QuestionPaper document or null if not found.
 * @throws {Error} If a database error occurs.
 */
async function getQuestionPapersByCategory(category) {
  try {
    return await QuestionPaper.findOne({ category }).lean();
  } catch (error) {
    console.error(`Error fetching question paper for category "${category}":`, error);
    throw error;
  }
}

/**
 * Fetches details of a specific section within a category.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @returns {Promise<Object|null>} The section object or null if not found.
 * @throws {Error} If a database error occurs.
 */
async function getSectionDetails(category, sectionName) {
  try {
    const paper = await QuestionPaper.findOne({ category }).lean();
    return paper?.sections.find(section => section.name === sectionName) || null;
  } catch (error) {
    console.error(`Error getting section "${sectionName}" from category "${category}":`, error);
    throw error;
  }
}

/**
 * Creates a new question paper or updates an existing one.
 * @param {string} category - The category name.
 * @param {Array<Object>} sections - Array of section objects.
 * @returns {Promise<Document>} The created or updated QuestionPaper document.
 * @throws {Error} If a database error occurs.
 */
async function createOrUpdateQuestionPaper(category, sections) {
  try {
    return await QuestionPaper.findOneAndUpdate(
      { category },
      { $set: { sections } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  } catch (error) {
    console.error(`Error creating/updating question paper for category "${category}":`, error);
    throw error;
  }
}

// ======================= Set Management Services ==========================

/**
 * Get all sets for a given category and section, including their time limits.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @returns {Promise<Array>} Array of set objects ({ name, timeLimitMinutes }).
 * @throws {Error} If category or section is not found.
 */
async function getSets(category, sectionName) {
  try {
    const paper = await QuestionPaper.findOne({ category }).lean();
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    // Map to include only necessary set details, ensuring timeLimitMinutes is conditionally added
    return section.sets.map(set => ({
      name: set.name,
      ...(set.timeLimitMinutes !== null && set.timeLimitMinutes !== undefined && { timeLimitMinutes: set.timeLimitMinutes })
    }));
  } catch (error) {
    console.error(`Error getting sets for section "${sectionName}" in category "${category}":`, error);
    throw error;
  }
}

/**
 * Add a new set to a section.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {Object} newSet - Object containing name and optional timeLimitMinutes.
 * @returns {Promise<Array>} The updated array of sets for the section.
 * @throws {Error} If category/section/set is invalid or already exists.
 */
async function addSet(category, sectionName, newSet) {
  try {
    const { name, timeLimitMinutes = null } = newSet;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Invalid set name provided.');
    }

    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    if (section.sets.some(set => set.name === name)) {
      throw new Error('Set with this name already exists in the section.');
    }

    // Ensure numberOfQuestions is valid before saving. This might be better handled in schema or separate validation.
    // However, as per your original code, ensuring a minimum of 1 here.
    // This loop is applying to all sections, which might be unintended if only one section is being targeted for sets.
    // It's likely safer to ensure numberOfQuestions is correctly set during QuestionPaper creation or individual section updates.
    // For now, retaining the original logic but noting the potential scope issue.
    paper.sections.forEach(sec => {
      if (sec.numberOfQuestions === undefined || sec.numberOfQuestions < 1) {
        sec.numberOfQuestions = 1; // minimum allowed
      }
    });

    section.sets.push({ name, timeLimitMinutes });
    await paper.save(); // Save the parent document to persist subdocument changes
    return section.sets.toObject(); // Return a plain object array
  } catch (error) {
    console.error(`Error adding set to section "${sectionName}" in category "${category}":`, error);
    throw error;
  }
}

/**
 * Update an existing set's name and/or time limit.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {string} oldSetName - The current name of the set to update.
 * @param {Object} newSetData - Object containing new name and/or timeLimitMinutes.
 * @returns {Promise<Array>} The updated array of sets for the section.
 * @throws {Error} If category/section/set is not found or new set name conflicts.
 */
async function updateSet(category, sectionName, oldSetName, newSetData) {
  try {
    const { name: newSetName, timeLimitMinutes } = newSetData;
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    const set = section.sets.find(set => set.name === oldSetName);
    if (!set) throw new Error('Old set not found');

    if (newSetName && newSetName !== oldSetName && section.sets.some(s => s.name === newSetName)) {
      throw new Error('New set name already exists in this section.');
    }

    if (newSetName) set.name = newSetName;
    // Check if timeLimitMinutes is explicitly provided (can be 0 or null)
    if (typeof timeLimitMinutes === 'number' || timeLimitMinutes === null) {
      set.timeLimitMinutes = timeLimitMinutes;
    }
    await paper.save();
    return section.sets.toObject(); // Return a plain object array
  } catch (error) {
    console.error(`Error updating set "${oldSetName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}

/**
 * Update only the time limit of a specific set.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {string} setName - The name of the set to update.
 * @param {number|null} timeLimitMinutes - The new time limit in minutes, or null to remove.
 * @returns {Promise<Object>} The updated set object.
 * @throws {Error} If category/section/set is not found.
 */
async function updateSetTimeLimit(category, sectionName, setName, timeLimitMinutes) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    const set = section.sets.find(set => set.name === setName);
    if (!set) throw new Error('Set not found');

    set.timeLimitMinutes = timeLimitMinutes;
    await paper.save();
    return set.toObject(); // Return a plain object
  } catch (error) {
    console.error(`Error updating time limit of set "${setName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}

/**
 * Deletes the time limit of a specific set (sets it to null).
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {string} setName - The name of the set.
 * @returns {Promise<Object>} The updated set object with timeLimitMinutes as null.
 * @throws {Error} If category/section/set is not found.
 */
async function deleteSetTimeLimit(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    const set = section.sets.find(set => set.name === setName);
    if (!set) throw new Error('Set not found');

    set.timeLimitMinutes = null; // Set timeLimit to null to "delete" it
    await paper.save();
    return set.toObject(); // Return a plain object
  } catch (error) {
    console.error(`Error deleting time limit of set "${setName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}

/**
 * Deletes a set from a section.
 * @param {string} category - The category name.
 * @param {string} sectionName - The section name.
 * @param {string} setName - The name of the set to delete.
 * @returns {Promise<Array>} The updated array of sets for the section.
 * @throws {Error} If category/section/set is not found.
 */
async function deleteSet(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    const initialLength = section.sets.length;
    // Filter out the set to be deleted
    section.sets = section.sets.filter(set => set.name !== setName);

    if (section.sets.length === initialLength) {
      throw new Error('Set not found or already deleted.'); // If length didn't change, set wasn't found
    }

    await paper.save();
    return section.sets.toObject(); // Return a plain object array
  } catch (error) {
    console.error(`Error deleting set "${setName}" from section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}

// ======================= Additional Fetch Utilities Services ==========================
// Fetch all categories, sections, and sets (structured data for exam papers)
async function getAllCategoriesSectionsSets() {
  // This service function would likely need to retrieve specific fields
  // or aggregate data from QuestionPaper model if you want a concise structure
  return QuestionPaper.find({}, 'category sections.name sections.sets.name sections.sets.timeLimitMinutes');
}

// Fetch sections for a specific category
async function getSectionsByCategory(category) {
  const questionPaper = await QuestionPaper.findOne({ category });
  return questionPaper ? questionPaper.sections.map(s => s.name) : null;
}
// Fetch sets for a specific category and section
async function getSetsByCategoryAndSection(category, sectionName) {
  const questionPaper = await QuestionPaper.findOne({ category });
  if (!questionPaper) return null;
  const section = questionPaper.sections.find(s => s.name === sectionName);
  return section ? section.sets : null;
}
/**
 * Service function to bulk insert questions into the database.
 * @param {Array} questions - An array of question objects parsed from the Excel file, including 'marks'.
 * @returns {Promise<Array>} - The array of inserted question documents.
 */
async function bulkUploadQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions provided for bulk upload.");
  }

  // Optional: Add validation for each question object here before inserting
  // For example, check if 'marks' is present and a valid number.
  for (const questionData of questions) {
    if (typeof questionData.marks !== 'number' || isNaN(questionData.marks) || questionData.marks < 0) {
      throw new Error(`Invalid marks value encountered during bulk upload: ${questionData.marks}`);
    }
    // Add more validation as needed (e.g., presence of category, section, set, options)
    const isValid = await validateSectionAndSet(questionData.category, questionData.section, questionData.set);
    if (!isValid) {
      throw new Error(`Invalid section or set for category "${questionData.category}" during bulk upload for question: ${questionData.questionText}`);
    }
  }

  // Use insertMany for efficient bulk insertion
  const insertedQuestions = await Question.insertMany(questions);
  return insertedQuestions;
}


// --- Module Exports ---
module.exports = {
  // Question Paper services
  getAllQuestionPapers,
  getQuestionPapersByCategory,
  getSectionDetails,
  createOrUpdateQuestionPaper,

  // Set services
  getSets,
  addSet,
  updateSet,
  deleteSet,
  updateSetTimeLimit,
  deleteSetTimeLimit,

  // Question services
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  getQuestionsBySet,
  bulkUploadQuestions, // This line was corrected to remove the comma before it

  // Additional Fetcher Services
  getAllCategoriesSectionsSets,
  getSectionsByCategory,
  getSetsByCategoryAndSection
};
