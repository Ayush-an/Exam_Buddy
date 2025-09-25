// D:\Exam-portel\backend\controller\question.controller.js
const questionServices = require('../services/question.services');
const { Question } = require('../models/question.model');
const mongoose = require('mongoose');
const crypto = require("crypto");
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs'); 

// ======================= Question Paper Management ==========================
/** Get all question paper categories and their sections and sets */
async function getAllQuestionPapers(req, res) {
  try {
    const questionPapers = await questionServices.getAllQuestionPapers();
    res.status(200).json(questionPapers);
  } catch (error) {
    console.error('Error in getAllQuestionPapers controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/** Get question paper by category */
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

/** Get section details for a category */
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

/** Create or update a question paper */
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
/** Create a new question */
async function createQuestion(req, res) {
  try {
    // Log req.body and req.files to inspect the incoming data structure after Multer
    console.log("--- createQuestion Controller START ---");
    console.log("req.body (raw from Multer):", req.body);
    console.log("req.files (raw from Multer):", req.files);
    console.log("-------------------------------------");

    // Start with a new object to build our clean questionData
    let questionData = {};

    // --- Process general text fields, including marks ---
    questionData.category = req.body.category;
    questionData.section = req.body.section;
    questionData.set = req.body.set;
    questionData.questionText = req.body.questionText;
    questionData.correctAnswer = req.body.correctAnswer;
    questionData.marks = Number(req.body.marks);

    // --- Process questionImage and questionAudio from req.files ---
    const uploadedFiles = req.files || [];

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
                content: optionFile.path
            };
        }
        // For text options, or if no file was uploaded for an image/audio option,
        // use the content directly from req.body (which would be the string text or null/empty)
        return {
            type: option.type,
            content: option.content
        };
    });


    // --- Validation Logic (more specific now) ---

    // Validate required scalar fields
    const scalarRequiredFields = ['category', 'section', 'set', 'questionText', 'correctAnswer', 'marks'];
    for (const field of scalarRequiredFields) {
      if (!questionData[field] && questionData[field] !== 0 || (typeof questionData[field] === 'string' && questionData[field].trim() === '')) {
        console.error(`Validation error: Missing or empty required field - ${field}`);
        return res.status(400).json({ message: `Field "${field}" is required.` });
      }
    }

    // Validate marks specifically
    if (typeof questionData.marks !== 'number' || isNaN(questionData.marks) || questionData.marks < 0) {
      console.error(`Validation error: Invalid marks value - ${questionData.marks}`);
      return res.status(400).json({ message: 'Marks must be a non-negative number.' });
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
    console.error('Error object:', error);

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

/** Get all questions for a specific category, section, and set */
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

/** Get all questions */
async function getAllQuestions(req, res) {
  try {
    const questions = await questionServices.getAllQuestions();
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error in getAllQuestions controller:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/** Get question by ID */
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

/** Delete question by ID */
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
/** Get all sets of a section. */
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

/** Add a new set to a section. Expects { name, timeLimitMinutes (optional) } in req.body */
async function addSet(req, res) {
  const { category, sectionName } = req.params;
  const newSet = {
    name: req.body.name,
    timeLimitMinutes: req.body.timeLimit ? parseInt(req.body.timeLimit, 10) : undefined,
  };
  try {
    // Basic validation in the controller
    if (!newSet.name || typeof newSet.name !== 'string' || newSet.name.trim() === '') {
        return res.status(400).json({ message: 'Set name is required and cannot be empty.' });
    }
    const sets = await questionServices.addSet(category, sectionName, newSet);
    res.status(201).json({ message: 'Set added successfully', sets });
  } catch (error) {
    console.error('Error in addSet controller:', error);
    res.status(400).json({ message: error.message });
  }
}

/** Update set name and/or time limit */
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

/** Update only the time limit of a set */
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

/** Delete time limit from a set */
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

/** Delete a set from a section */
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
/** Fetch all categories, sections, and sets (structured data for exam papers)*/
async function fetchAllCategories(req, res) {
  try {
    const data = await questionServices.getAllCategoriesSectionsSets();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error in fetchAllCategories controller:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/** Fetch sections for a specific category */
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

/** Fetch sets for a specific category and section */
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

/** Handles bulk upload of questions from an Excel file & Expects an Excel file with specific column headers for question data */
async function bulkUploadQuestions(req, res) {
  let filePath;
  try {
    const { category, section, set } = req.body; // Get category, section, set from form fields
    const excelFile = req.files.find(file => file.fieldname === 'excelFile'); // Find the uploaded Excel file

    if (!excelFile) {
      return res.status(400).json({ message: 'No Excel file uploaded.' });
    }
    if (!category || !section || !set) {
      return res.status(400).json({ message: 'Category, Section, and Set are required for bulk upload.' });
    }

    filePath = path.join(__dirname, '..', excelFile.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const questionsToSave = [];

    for (const row of jsonData) {
      const questionText = row.questionText;
      const optionA = row.optionA;
      const optionB = row.optionB;
      const optionC = row.optionC;
      const optionD = row.optionD;
      const correctAnswer = row.correctAnswer?.toLowerCase();
      const marks = Number(row.marks);

      // Skip row if essential data is missing or marks are invalid
      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer || isNaN(marks) || marks < 0) {
        console.warn('Skipping row due to missing essential data or invalid marks (check Excel headers and data types):', row);
        continue; // Skip to the next row
      }

      // Default option type to 'text', can be extended for image/audio options from Excel
      // Assuming 'Option A Type'
      const options = [
        { type: row.optionAType || 'text', content: optionA },
        { type: row.optionBType || 'text', content: optionB },
        { type: row.optionCType || 'text', content: optionC },
        { type: row.optionDType || 'text', content: optionD },
      ];
      const questionImage = row.questionImage || null;
      const questionAudio = row.questionAudio || null;

      questionsToSave.push({
        category, section, set, questionText, questionImage, questionAudio, options, correctAnswer, marks,
      });
    }

    if (questionsToSave.length === 0) {
      return res.status(400).json({ message: 'No valid questions found in the Excel file to process. Please ensure column headers match expected format (e.g., questionText, optionA, correctAnswer, marks) and data types are correct.' });
    }
    // Call the service layer to save questions
    const uploadedQuestions = await questionServices.bulkUploadQuestions(questionsToSave);

    res.status(200).json({
      message: `${uploadedQuestions.length} questions uploaded successfully from Excel!`,
      uploadedCount: uploadedQuestions.length,
    });

  } catch (error) {
    console.error('Error during bulk Excel upload:', error);
    res.status(500).json({ message: 'Failed to upload questions from Excel.', error: error.message });
  } finally {
    // Optional: Delete the uploaded Excel file after processing to save disk space
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded Excel file:', unlinkErr);
      });
    }
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
  getQuestionsBySet,
  bulkUploadQuestions,

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
