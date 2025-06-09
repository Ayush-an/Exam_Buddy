const { Question, QuestionPaper } = require('../models/question.model');
const mongoose = require('mongoose');

async function createQuestion(questionData) {
  try {
    const { category, section, set } = questionData;
    // Note: The validation for section and set being valid is now in the controller
    // to leverage the req.body parsing from multer.
    // If you want to keep validateSectionAndSet here, ensure it fetches from the database
    // using the parsed data and that your controller passes correctly.
    // For now, assuming controller's validation is sufficient.

    const question = new Question(questionData);
    return await question.save();
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

/**
 * Get all questions for a specific category, section, and set.
 * @param {string} category
 * @param {string} section
 * @param {string} set
 * @returns {Promise<Array>} Array of question objects
 */
async function getQuestionsBySet(category, section, set) {
  try {
    // Find questions that match all three criteria
    const questions = await Question.find({ category, section, set });
    return questions;
  } catch (error) {
    console.error(`Error fetching questions for category "${category}", section "${section}", set "${set}":`, error);
    throw error;
  }
}
/**
 * Validates if a section exists within a category and if the set belongs to that section.
 * @param {string} category
 * @param {string} sectionName
 * @param {string} setName
 * @returns {Promise<boolean>}
 */
// In question.services.js
async function validateSectionAndSet(category, sectionName, setName) {
  console.log(`--- Running validateSectionAndSet for Category: "${category}", Section: "${sectionName}", Set: "${setName}" ---`);
  try {
    const paper = await mongoose.model('QuestionPaper').findOne({ category: category });
    console.log("Step 1: QuestionPaper found?", !!paper); // Convert to boolean for clearer log
    if (!paper) {
      console.error(`Validation Failed: QuestionPaper for category "${category}" not found.`);
      return false;
    }
    console.log("Step 1.1: QuestionPaper object:", JSON.stringify(paper.toObject(), null, 2)); // Log the entire paper object

    const section = paper.sections.find(sec => sec.name === sectionName);
    console.log("Step 2: Section found?", !!section);
    if (!section) {
      console.error(`Validation Failed: Section "${sectionName}" not found in category "${category}".`);
      return false;
    }
    console.log("Step 2.1: Section object:", JSON.stringify(section.toObject(), null, 2));

    if (!section.sets || section.sets.length === 0) {
      console.error(`Validation Failed: Section "${sectionName}" has no sets defined.`);
      // This part handles if setName is provided but there are no sets.
      return false;
    }
    const setExists = section.sets.some(s => s.name === setName);
    console.log(`Step 3: Checking if set "${setName}" exists in section "${sectionName}".`);
    console.log("Step 3.1: All sets in section:", section.sets.map(s => s.name));
    console.log(`Step 3.2: Does "${setName}" exist?`, setExists);
    return setExists;
  } catch (error) {
    console.error('Error in validateSectionAndSet:', error);
    return false;
  } finally {
    console.log("--- End validateSectionAndSet ---");
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
/**
 * Get all sets for a given category and section (including their time limits)
 */
async function getSets(category, sectionName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');

    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');

    return section.sets.map(set => ({
      name: set.name,
      ...(set.timeLimitMinutes && { timeLimitMinutes: set.timeLimitMinutes })
    }));
  } catch (error) {
    console.error(`Error getting sets for section "${sectionName}" in category "${category}":`, error);
    throw error;
  }
}

/**
 * Add a new set to a section (optionally with time limit)
 */
async function addSet(category, sectionName, newSet) {
  try {
    console.log("Incoming set payload:", newSet);
    const { name, timeLimitMinutes = null } = newSet;
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Invalid set name');
    }
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');
    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');
    if (section.sets.some(set => set.name === name)) {
      throw new Error('Set already exists');
    }
    // Fix numberOfQuestions for all sections
    paper.sections.forEach(sec => {
      if (sec.numberOfQuestions === undefined || sec.numberOfQuestions < 1) {
        sec.numberOfQuestions = 1; // minimum allowed
      }
    });
    section.sets.push({ name, timeLimitMinutes });
    await paper.save();
    return section.sets;
  } catch (error) {
    console.error(`Error adding set to section "${sectionName}" in category "${category}":`, error);
    throw error;
  }
}
/**
 * Update a set's name and/or time limit
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
      throw new Error('New set name already exists');
    }
    if (newSetName) set.name = newSetName;
    if (typeof timeLimitMinutes === 'number') set.timeLimitMinutes = timeLimitMinutes;
    await paper.save();
    return section.sets;
  } catch (error) {
    console.error(`Error updating set "${oldSetName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}
/**
 * Update only the time limit of a set
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
    return set;
  } catch (error) {
    console.error(`Error updating time limit of set "${setName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}
/**
 * Delete time limit of a set
 */
async function deleteSetTimeLimit(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');
    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');
    const set = section.sets.find(set => set.name === setName);
    if (!set) throw new Error('Set not found');
    set.timeLimitMinutes = null;
    await paper.save();
    return set;
  } catch (error) {
    console.error(`Error deleting time limit of set "${setName}" in section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}
const getAllCategoriesSectionsSets = async () => {
  const papers = await QuestionPaper.find({}, { category: 1, sections: 1, _id: 0 }).lean();
  return papers; // array of { category, sections: [ { name, sets, ... } ] }
};
const getSectionsByCategory = async (category) => {
  const paper = await QuestionPaper.findOne({ category }, { sections: 1, _id: 0 }).lean();
  if (!paper) return null;
  return paper.sections;
};
const getSetsByCategoryAndSection = async (category, sectionName) => {
  const paper = await QuestionPaper.findOne({ category }, { sections: 1 }).lean();
  if (!paper) return null;
  const section = paper.sections.find(sec => sec.name === sectionName);
  if (!section) return null;
  return section.sets;
};
/**
 * Delete a set from a section
 */
async function deleteSet(category, sectionName, setName) {
  try {
    const paper = await QuestionPaper.findOne({ category });
    if (!paper) throw new Error('Category not found');
    const section = paper.sections.find(sec => sec.name === sectionName);
    if (!section) throw new Error('Section not found');
    const index = section.sets.findIndex(set => set.name === setName);
    if (index === -1) throw new Error('Set not found');
    section.sets.splice(index, 1);
    await paper.save();
    return section.sets;
  } catch (error) {
    console.error(`Error deleting set "${setName}" from section "${sectionName}" of category "${category}":`, error);
    throw error;
  }
}
async function addSetToSection(categoryName, sectionName, setName, timeLimit) {
  if (!setName || typeof setName !== 'string' || setName.trim() === '') {
    throw new Error('Invalid set name');
  }
  // your logic here
}
module.exports = {
  // QuestionPaper services
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
  getQuestionsBySet // <--- ADD THIS NEW FUNCTION
};
