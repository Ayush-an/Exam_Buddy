const questionServices = require('../services/question.services');
const { Question } = require('../models/question.model');
const mongoose = require('mongoose'); // For ObjectId validation if needed in controller directly
const crypto = require("crypto"); // Assuming this is used elsewhere, though not in this specific file's snippets.

// ======================= Question Paper Management ==========================
/**
 * Get all question paper categories and their sections and sets.
 */
async function getAllQuestionPapers(req, res) {
  try {
    const questionPapers = await questionServices.getAllQuestionPapers();
    res.status(200).json(questionPapers);
  } catch (error) {
    console.error('Error in getAllQuestionPapers controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get question paper by category.
 */
async function getQuestionPapersByCategory(req, res) {
  const { category } = req.params;
  try {
    const paper = await questionServices.getQuestionPapersByCategory(category);
    if (!paper) return res.status(404).json({ message: `Category '${category}' not found.` });
    res.status(200).json(paper);
  } catch (error) {
    console.error('Error in getQuestionPapersByCategory controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Get section details for a category.
 */
async function getSectionDetails(req, res) {
  const { category, sectionName } = req.params;
  try {
    const section = await questionServices.getSectionDetails(category, sectionName);
    if (!section) {
      return res.status(404).json({ message: `Section '${sectionName}' not found in category '${category}'.` });
    }
    res.status(200).json(section);
  } catch (error) {
    console.error('Error in getSectionDetails controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/**
 * Create or update a question paper.
 */
async function createOrUpdateQuestionPaper(req, res) {
  const { category, sections } = req.body;
  if (!category || !Array.isArray(sections)) {
    return res.status(400).json({ message: 'Category and array of sections are required.' });
  }
  try {
    const paper = await questionServices.createOrUpdateQuestionPaper(category, sections);
    res.status(201).json(paper);
  } catch (error) {
    console.error('Error in createOrUpdateQuestionPaper controller:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// ========================== Question Management =============================
/**
 * Create a new question.
 */
async function createQuestion(req, res) {
  try {
    // Log req.body and req.files to inspect the incoming data structure after Multer
    console.log("--- createQuestion Controller START ---");
    console.log("req.body (raw from Multer):", req.body);
    console.log("req.files (raw from Multer):", req.files);
    console.log("-------------------------------------");

    // Start with a new object to build our clean questionData
    let questionData = {};

    // --- Process general text fields ---
    questionData.category = req.body.category;
    questionData.section = req.body.section;
    questionData.set = req.body.set;
    questionData.questionText = req.body.questionText;
    questionData.correctAnswer = req.body.correctAnswer;

    // --- Process questionImage and questionAudio from req.files ---
    const uploadedFiles = req.files || []; // Ensure it's an array even if empty

    const qImageFile = uploadedFiles.find(f => f.fieldname === 'questionImage');
    const qAudioFile = uploadedFiles.find(f => f.fieldname === 'questionAudio');

    questionData.questionImage = qImageFile ? qImageFile.path : null;
    questionData.questionAudio = qAudioFile ? qAudioFile.path : null;

    // --- IMPORTANT: Reconstruct the 'options' array from req.body (or use it directly if Multer reconstructed it) ---
    let parsedOptions = [];
    if (Array.isArray(req.body.options)) {
        // Multer correctly reconstructed the array directly
        parsedOptions = req.body.options;
    } else {
        // Fallback for manual reconstruction if Multer flattens (less likely with modern Multer for array fields)
        let i = 0;
        while (req.body[`options[${i}][type]`] !== undefined) {
            const optionType = req.body[`options[${i}][type]`];
            let optionContent = req.body[`options[${i}][content]`];

            const currentOptionFile = uploadedFiles.find(f => f.fieldname === `options[${i}][content]`);
            if (currentOptionFile) {
                optionContent = currentOptionFile.path;
            }
            parsedOptions.push({
                type: optionType,
                content: optionContent
            });
            i++;
        }
    }

    // Now, go through the `parsedOptions` and replace content for files
    questionData.options = parsedOptions.map((option, idx) => {
        const optionFile = uploadedFiles.find(f => f.fieldname === `options[${idx}][content]`);
        if (optionFile) {
            return {
                type: option.type,
                content: optionFile.path // Use the path from the uploaded file
            };
        }
        // For text options, or if no file was uploaded for an image/audio option,
        // use the content directly from req.body (which would be the string text or null/empty)
        return {
            type: option.type,
            content: option.content // This is the 'content' from req.body, or previously set to a file path
        };
    });


    // --- Validation Logic (more specific now) ---

    // Validate required scalar fields
    const scalarRequiredFields = ['category', 'section', 'set', 'questionText', 'correctAnswer'];
    for (const field of scalarRequiredFields) {
      if (!questionData[field] || (typeof questionData[field] === 'string' && questionData[field].trim() === '')) {
        console.error(`Validation error: Missing or empty required field - ${field}`);
        return res.status(400).json({ message: `Field "${field}" is required.` });
      }
    }

    // Validate options array explicitly
    if (!Array.isArray(questionData.options) || questionData.options.length < 2) {
      console.error('Validation error: Options array invalid (must be an array with at least two items).');
      return res.status(400).json({ message: 'Field "options" must be an array with at least two items.' });
    }

    // Validate each option's content based on its type
    for (const [idx, option] of questionData.options.entries()) {
      if (!option.type || !['text', 'image', 'audio'].includes(option.type)) {
          console.error(`Validation error: Invalid type for option ${idx}.`);
          return res.status(400).json({ message: `Invalid type for option ${String.fromCharCode(97 + idx)}.` });
      }
      if (!option.content || (typeof option.content === 'string' && option.content.trim() === '')) {
          console.error(`Validation error: Empty content for option ${idx} (${option.type} type).`);
          return res.status(400).json({ message: `Content is required for option ${String.fromCharCode(97 + idx)}.` });
      }
    }

    // Validate correct answer index
    const correctOptionChar = String(questionData.correctAnswer).toLowerCase();
    const correctOptionIndex = correctOptionChar.charCodeAt(0) - 'a'.charCodeAt(0);
    if (correctOptionIndex < 0 || correctOptionIndex >= questionData.options.length) {
      console.error('Validation error: Invalid correct answer index.');
      return res.status(400).json({ message: 'The correct answer must correspond to a valid option (a, b, c, d...).' });
    }

    // If validation passes, create and save the question
    const savedQuestion = await questionServices.createQuestion(questionData);
    console.log("--- Question created successfully ---");
    res.status(201).json(savedQuestion);

  } catch (error) {
    console.error('--- Error in createQuestion controller ---');
    console.error('Error object:', error); // Log the full error object for detailed insights

    if (error.message && error.message.startsWith('Invalid section')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      console.error('Mongoose Validation Errors details:', error.errors);
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({ message: 'Validation failed', errors: errors });
    }
    // Generic server error
    res.status(500).json({ message: 'Internal server error', error: error.message || 'Unknown error' });
  } finally {
    console.log("--- createQuestion Controller END ---");
  }
}

/**
 * Get all questions for a specific category, section, and set.
 */
async function getQuestionsBySet(req, res) {
  const { category, section, set } = req.params;
  try {
    const questions = await questionServices.getQuestionsBySet(category, section, set);
    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: `No questions found for set "${set}" in section "${section}" of category "${category}".` });
    }
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error in getQuestionsBySet controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message || 'Unknown error' });
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
    console.error('Error in getAllQuestions controller:', error);
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
    console.error('Error in getQuestionById controller:', error);
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
    console.error('Error in deleteQuestionById controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// ======================= Set Management ==========================
/**
 * Get all sets of a section.
 */
async function getSets(req, res) {
  const { category, sectionName } = req.params;

  try {
    const sets = await questionServices.getSets(category, sectionName);
    res.status(200).json(sets);
  } catch (error) {
    console.error('Error in getSets controller:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Add a new set to a section.
 * Expects { name, timeLimitMinutes (optional) } in req.body
 */
async function addSet(req, res) {
  const { category, sectionName } = req.params;
  const newSet = {
    name: req.body.name,
    timeLimitMinutes: req.body.timeLimit ? parseInt(req.body.timeLimit, 10) : undefined,
  };
  try {
    // Basic validation in the controller as a good practice
    if (!newSet.name || typeof newSet.name !== 'string' || newSet.name.trim() === '') {
        return res.status(400).json({ message: 'Set name is required and cannot be empty.' });
    }
    // The service layer already throws specific errors like "Set already exists" or "Category not found",
    // which your controller correctly catches and sends.
    const sets = await questionServices.addSet(category, sectionName, newSet);
    res.status(201).json({ message: 'Set added successfully', sets });
  } catch (error) {
    console.error('Error in addSet controller:', error);
    res.status(400).json({ message: error.message });
  }
}

/**
 * Update set name and/or time limit.
 */
async function updateSet(req, res) {
  const { category, sectionName, oldSetName } = req.params;
  const newSetData = req.body;

  try {
    const updatedSets = await questionServices.updateSet(category, sectionName, oldSetName, newSetData);
    res.status(200).json({ message: 'Set updated successfully', sets: updatedSets });
  } catch (error) {
    console.error('Error in updateSet controller:', error);
    res.status(400).json({ message: error.message });
  }
}

/**
 * Update only the time limit of a set.
 */
async function updateSetTimeLimit(req, res) {
  const { category, sectionName, setName } = req.params;
  const { timeLimitMinutes } = req.body;
  try {
    const updated = await questionServices.updateSetTimeLimit(category, sectionName, setName, timeLimitMinutes);
    res.status(200).json({ message: 'Time limit updated', set: updated });
  } catch (error) {
    console.error('Error in updateSetTimeLimit controller:', error);
    res.status(400).json({ message: error.message });
  }
}

/**
 * Delete time limit from a set.
 */
async function deleteSetTimeLimit(req, res) {
  const { category, sectionName, setName } = req.params;
  try {
    const updated = await questionServices.deleteSetTimeLimit(category, sectionName, setName);
    res.status(200).json({ message: 'Time limit removed', set: updated });
  } catch (error) {
    console.error('Error in deleteSetTimeLimit controller:', error);
    res.status(400).json({ message: error.message });
  }
}

/**
 * Delete a set from a section.
 */
async function deleteSet(req, res) {
  const { category, sectionName, setName } = req.params;
  try {
    const updatedSets = await questionServices.deleteSet(category, sectionName, setName);
    res.status(200).json({ message: 'Set deleted successfully', sets: updatedSets });
  } catch (error) {
    console.error('Error in deleteSet controller:', error);
    res.status(400).json({ message: error.message });
  }
}

// ======================= Additional Fetch Utilities ==========================
/**
 * Fetch all categories, sections, and sets (structured data for exam papers).
 */
async function fetchAllCategories(req, res) {
  try {
    const data = await questionServices.getAllCategoriesSectionsSets();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error in fetchAllCategories controller:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/**
 * Fetch sections for a specific category.
 */
async function fetchSectionsByCategory(req, res) {
  const { category } = req.params;
  try {
    const sections = await questionServices.getSectionsByCategory(category);
    if (!sections) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(sections);
  } catch (err) {
    console.error('Error in fetchSectionsByCategory controller:', err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
}

/**
 * Fetch sets for a specific category and section.
 */
async function fetchSetsByCategorySection(req, res) {
  const { category, section } = req.params;
  try {
    const sets = await questionServices.getSetsByCategoryAndSection(category, section);
    if (!sets) return res.status(404).json({ error: 'Section or category not found' });
    res.status(200).json(sets);
  } catch (err) {
    console.error('Error in fetchSetsByCategorySection controller:', err);
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
}

// --- Module Exports ---
module.exports = {
  // Question Paper Controllers
  getAllQuestionPapers,
  getQuestionPapersByCategory,
  getSectionDetails,
  createOrUpdateQuestionPaper,

  // Question Controllers
  createQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestionById,
  getQuestionsBySet, // Exporting the function to fetch questions by set

  // Set Controllers
  getSets,
  addSet,
  updateSet,
  updateSetTimeLimit,
  deleteSetTimeLimit,
  deleteSet,

  // Additional Fetcher Controllers
  fetchAllCategories,
  fetchSectionsByCategory,
  fetchSetsByCategorySection,
};
