//question.model.js

const mongoose = require('mongoose');

// Section schema with sets
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
    // New: Array of sets under this section, e.g. ["math", "science"]
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        // ensure all sets are unique and non-empty strings
        return Array.isArray(arr) && arr.every(s => typeof s === 'string' && s.trim().length > 0) && new Set(arr).size === arr.length;
      },
      message: 'Sets must be a unique array of non-empty strings.'
    }
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
  timestamps: true
});

// Seeding function with example sets added
questionPaperSchema.statics.seedInitialData = async function () {
  const categories = ['Beginner', 'Intermediate', 'Advanced'];

  const data = categories.map(category => {
    let sections = [];
    switch (category) {
      case 'Beginner':
        sections = [
          { name: 'Beginner', isPaid: false, description: 'Free sample question paper.', sets: ['math', 'science'] },
          { name: 'Intermediate', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: ['physics', 'chemistry'] },
          { name: 'Advanced', isPaid: true, description: 'Paid section, may or may not have time limit.', sets: ['biology'] },
          { name: 'Pro Advanced', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: ['computer science'] }
        ];
        break;
      case 'Intermediate':
        sections = [
          { name: 'Beginner Challenge', isPaid: false, description: 'Free sample question paper.', sets: ['math challenge'] },
          { name: 'Intermediate Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: ['science challenge'] },
          { name: 'Advanced Challenge', isPaid: true, description: 'Paid section, may or may not have time limit.', sets: [] },
          { name: 'Pro Advanced Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] }
        ];
        break;
      case 'Advanced':
        sections = [
          { name: 'Beginner Level', isPaid: false, description: 'Free sample question paper.', sets: [] },
          { name: 'Intermediate Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] },
          { name: 'Advanced Level', isPaid: true, description: 'Paid section, may or may not have time limit.', sets: [] },
          { name: 'Pro Advanced Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] }
        ];
        break;
    }
    return { category, sections };
  });

  for (const item of data) {
    await this.findOneAndUpdate(
      { category: item.category },
      { $set: { sections: item.sections } },
      { upsert: true, new: true }
    );
  }

  console.log('✅ Initial question paper data seeded successfully.');
};

// Question schema updated to include section & set validation
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
    // The set must be one of the sets defined under the section
    type: String,
    required: true
    // You could add custom validation if you want to check this on save (needs a lookup in DB)
  },
  questionText: String,
  questionImage: String,
  questionAudio: String,
  options: [
    {
      type: {
        type: String,
        enum: ['text', 'image', 'audio'],
        required: true
      },
      content: {
        type: String,
        required: true
      }
    }
  ],
  correctAnswer: {
    type: String,
    enum: ['a', 'b', 'c', 'd'],
    required: true
  },
  timer: {
    type: Number,
    default: null
  }
});

const Question = mongoose.model('Question', questionSchema);
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

module.exports = { Question, QuestionPaper };
