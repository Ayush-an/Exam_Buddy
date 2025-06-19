const mongoose = require('mongoose');

// Section schema with sets now containing time limits per set
const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      'Beginner', 'Intermediate', 'Advanced', 'Pro Advanced',
      'Beginner Challenge', 'Intermediate Challenge', 'Advanced Challenge', 'Pro Advanced Challenge',
      'Beginner Level', 'Intermediate Level', 'Advanced Level', 'Pro Advanced Level'
    ]
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  hasTimeLimit: {
    type: Boolean,
    default: false
  },
  timeLimitMinutes: {
    type: Number,
    min: 1,
    required: function () {
      return this.hasTimeLimit;
    }
  },
  numberOfQuestions: {
    type: Number,
    min: 1,
    required: function () {
      return this.hasTimeLimit || this.isPaid;
    }
  },
  description: {
    type: String,
    default: ''
  },
  sets: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        timeLimitMinutes: {
          type: Number,
          min: 1,
          default: null // Can be null if the set does not have a specific time limit
        }
      }
    ],
    validate: {
      validator: async function (arr) {
        // Ensure all set names are unique and not empty strings
        const names = arr.map(s => s.name);
        const uniqueNames = new Set(names);
        return names.every(name => typeof name === 'string' && name.trim() !== '') && names.length === uniqueNames.size;
      },
      message: 'Sets must be a unique array of objects with non-empty names.'
    },
    default: []
  }
});

// Question Paper schema
const questionPaperSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  sections: [sectionSchema]
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Question schema (individual question)
const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  section: {
    type: String,
    required: true,
    enum: [
      'Beginner', 'Intermediate', 'Advanced', 'Pro Advanced',
      'Beginner Challenge', 'Intermediate Challenge', 'Advanced Challenge', 'Pro Advanced Challenge',
      'Beginner Level', 'Intermediate Level', 'Advanced Level', 'Pro Advanced Level'
    ]
  },
  set: {
    type: String,
    required: true,
    validate: {
      validator: async function (value) {
        // 'this' refers to the current question document being validated
        const { category, section } = this;
        // Find the corresponding QuestionPaper document for the given category
        // Use mongoose.model('QuestionPaper') to avoid circular dependency if QuestionPaper is defined later
        const paper = await mongoose.model('QuestionPaper').findOne({ category });
        if (!paper) return false; // Category not found

        // Find the section within that question paper
        const matchedSection = paper.sections.find(sec => sec.name === section);
        if (!matchedSection) return false; // Section not found in category

        // Check if the provided set name exists within the found section's sets
        return matchedSection.sets.some(s => s.name === value);
      },
      message: 'Invalid set for the given category and section.'
    }
  },
  questionText: { type: String, required: true }, // Added required: true as question text is essential
  questionImage: String, // Path to an image file (optional)
  questionAudio: String, // Path to an audio file (optional)
  options: [ // Array of possible answers
    {
      type: { // Type of the option content (e.g., 'text', 'image', 'audio')
        type: String,
        enum: ['text', 'image', 'audio'],
        required: true
      },
      content: { // The actual content (text string or path to file)
        type: String,
        required: true
      }
    }
  ],
  correctAnswer: { // Letter of the correct option (e.g., 'a', 'b', 'c', 'd')
    type: String,
    enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], // Extended enum for more options if needed
    required: true
  },
  marks: { // NEW FIELD ADDED
    type: Number,
    required: true,
    min: 0,
    default: 1
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});


// Helper function to get all categories, sections, and sets data
const getAllCategoriesSectionsSets = async () => {
  const papers = await mongoose.model('QuestionPaper').find({}, { category: 1, sections: 1, _id: 0 }).lean();
  return papers;
};

// Helper function to get sections by category
const getSectionsByCategory = async (category) => {
  const paper = await mongoose.model('QuestionPaper').findOne({ category }, { sections: 1, _id: 0 }).lean();
  if (!paper) return null;
  return paper.sections;
};

// Helper function to get sets by category and section
const getSetsByCategoryAndSection = async (category, sectionName) => {
  const paper = await mongoose.model('QuestionPaper').findOne({ category }, { sections: 1 }).lean();
  if (!paper) return null;
  const section = paper.sections.find(sec => sec.name === sectionName);
  if (!section) return null;
  return section.sets;
};

// Static method for QuestionPaper to seed initial data
questionPaperSchema.statics.seedInitialData = async function () {
  const categories = ['Beginner', 'Intermediate', 'Advanced'];
  for (const category of categories) {
    let defaultSections = [];
    // Define default sections based on category
    switch (category) {
      case 'Beginner':
        defaultSections = [
          { name: 'Beginner', isPaid: false, hasTimeLimit: false, description: 'Free sample question paper for beginners.', sets: [] },
          { name: 'Intermediate', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit for intermediate users.', sets: [] },
          { name: 'Advanced', isPaid: true, hasTimeLimit: false, numberOfQuestions: 15, description: 'Paid section without fixed time limit, may have time limit per set.', sets: [] },
          { name: 'Pro Advanced', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit for pro advanced users.', sets: [] }
        ];
        break;
      case 'Intermediate':
        defaultSections = [
          { name: 'Beginner Challenge', isPaid: false, hasTimeLimit: false, description: 'Free challenge paper for beginners.', sets: [] },
          { name: 'Intermediate Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid challenge section with time limit.', sets: [] },
          { name: 'Advanced Challenge', isPaid: true, hasTimeLimit: false, numberOfQuestions: 15, description: 'Paid challenge section.', sets: [] },
          { name: 'Pro Advanced Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid challenge section with time limit.', sets: [] }
        ];
        break;
      case 'Advanced':
        defaultSections = [
          { name: 'Beginner Level', isPaid: false, hasTimeLimit: false, description: 'Free level paper for beginners.', sets: [] },
          { name: 'Intermediate Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid level section with time limit.', sets: [] },
          { name: 'Advanced Level', isPaid: true, hasTimeLimit: false, numberOfQuestions: 15, description: 'Paid level section.', sets: [] },
          { name: 'Pro Advanced Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid level section with time limit.', sets: [] }
        ];
        break;
    }
    let existingPaper = await this.findOne({ category });
    if (!existingPaper) {
      // If no paper exists for this category, create it with all default sections
      await this.create({ category, sections: defaultSections });
      console.log(`✅ Created initial QuestionPaper for category: ${category}`);
    } else {
      // If the paper exists, update its sections (non-destructively for existing sets)
      let sectionsChanged = false;
      for (const defaultSection of defaultSections) {
        const existingSection = existingPaper.sections.find(s => s.name === defaultSection.name);
        if (!existingSection) {
          // If a default section doesn't exist in the current paper, add it
          existingPaper.sections.push(defaultSection);
          sectionsChanged = true;
        } else {
          // Update properties if they are different from default (e.g., description, isPaid, hasTimeLimit etc.)
          if (existingSection.description !== defaultSection.description) {
            existingSection.description = defaultSection.description;
            sectionsChanged = true;
          }
          if (existingSection.isPaid !== defaultSection.isPaid) {
            existingSection.isPaid = defaultSection.isPaid;
            sectionsChanged = true;
          }
          if (existingSection.hasTimeLimit !== defaultSection.hasTimeLimit) {
            existingSection.hasTimeLimit = defaultSection.hasTimeLimit;
            sectionsChanged = true;
          }
          if (existingSection.timeLimitMinutes !== defaultSection.timeLimitMinutes && defaultSection.timeLimitMinutes !== undefined) {
            existingSection.timeLimitMinutes = defaultSection.timeLimitMinutes;
            sectionsChanged = true;
          }
          if (existingSection.numberOfQuestions !== defaultSection.numberOfQuestions && defaultSection.numberOfQuestions !== undefined) {
            existingSection.numberOfQuestions = defaultSection.numberOfQuestions;
            sectionsChanged = true;
          }
        }
      }
      if (sectionsChanged) {
        await existingPaper.save();
        console.log(`✅ Updated sections for existing QuestionPaper: ${category}`);
      } else {
        console.log(`✅ QuestionPaper for ${category} already up-to-date (no new sections or changes).`);
      }
    }
  }
  console.log('✅ Initial question paper data seeding completed (sets are preserved or managed via API).');
};

const Question = mongoose.model('Question', questionSchema);
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

/**
 * Fetch questions filtered by category, section, and set.
 * @param {String} category - Category name (e.g., 'Beginner')
 * @param {String} section - Section name (e.g., 'Beginner Challenge')
 * @param {String} set - Set name (e.g., 'Set 1')
 * @returns {Promise<Array>} - List of questions
 */
const fetchQuestionsByCategorySectionSet = async (category, section, set) => {
  if (!category || !section || !set) {
    throw new Error("Category, section, and set are required.");
  }
  const questions = await Question.find({
    category,
    section,
    set
  }).lean();
  return questions;

};


module.exports = { Question, QuestionPaper, fetchQuestionsByCategorySectionSet };
