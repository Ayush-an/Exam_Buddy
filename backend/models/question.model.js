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
default: null
}
 }
 ],
 validate: {
 validator: function (arr) {
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
timestamps: true
});
// Question schema (question does not have its own timer anymore)
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
 const { category, section } = this;
 const paper = await mongoose.model('QuestionPaper').findOne({ category });
 if (!paper) return false;
 const matchedSection = paper.sections.find(sec => sec.name === section);
 if (!matchedSection) return false;
 return matchedSection.sets.some(s => s.name === value);
 },
 message: 'Invalid set for the given category and section.'
 }
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
 }
});
const getAllCategoriesSectionsSets = async () => {
 // Fetch all question papers (each representing a category)
 const papers = await QuestionPaper.find({}, { category: 1, sections: 1, _id: 0 }).lean();
 // papers will be an array of objects with category, sections, and their sets
 return papers;
};
const getSectionsByCategory = async (category) => {
const paper = await QuestionPaper.findOne({ category }, { sections: 1, _id: 0 }).lean();
 if (!paper) return null; // or throw error
 return paper.sections;
};
const getSetsByCategoryAndSection = async (category, sectionName) => {
const paper = await QuestionPaper.findOne({ category }, { sections: 1 }).lean();
if (!paper) return null;
const section = paper.sections.find(sec => sec.name === sectionName);
if (!section) return null;
return section.sets;
};
// Seeding function updated with set time limits
questionPaperSchema.statics.seedInitialData = async function () {
const categories = ['Beginner', 'Intermediate', 'Advanced'];
for (const category of categories) {
let defaultSections = [];
// Define default sections based on category
switch (category) {
case 'Beginner':
defaultSections = [
{ name: 'Beginner', isPaid: false, description: 'Free sample question paper.', sets: [] },
{ name: 'Intermediate', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] },
{ name: 'Advanced', isPaid: true, hasTimeLimit: false, description: 'Paid section, may or may not have time limit.', sets: [] },
{ name: 'Pro Advanced', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] }
];
break;
case 'Intermediate':
defaultSections = [
{ name: 'Beginner Challenge', isPaid: false, description: 'Free sample question paper.', sets: [] },
{ name: 'Intermediate Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] },
{ name: 'Advanced Challenge', isPaid: true, description: 'Paid section.', sets: [] },
{ name: 'Pro Advanced Challenge', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] }
 ];
 break;
 case 'Advanced':
 defaultSections = [
 { name: 'Beginner Level', isPaid: false, description: 'Free sample question paper.', sets: [] },
 { name: 'Intermediate Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 20, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] },
 { name: 'Advanced Level', isPaid: true, description: 'Paid section.', sets: [] },
 { name: 'Pro Advanced Level', isPaid: true, hasTimeLimit: true, timeLimitMinutes: 15, numberOfQuestions: 15, description: 'Paid section with time limit.', sets: [] }
 ];
 break;
 }
// Find the existing question paper document for this category
 let existingPaper = await this.findOne({ category });
 if (!existingPaper) {
 // If no paper exists for this category, create it with all default sections
 await this.create({ category, sections: defaultSections });
 console.log(`✅ Created initial QuestionPaper for category: ${category}`);
 } else {
 // If the paper exists, update its sections, but be careful with existing sets
 let sectionsChanged = false;
 for (const defaultSection of defaultSections) {
 const existingSection = existingPaper.sections.find(s => s.name === defaultSection.name);
 if (!existingSection) {
 // If a default section doesn't exist in the current paper, add it
 existingPaper.sections.push(defaultSection);
 sectionsChanged = true;
 } else {
 if (existingSection.description !== defaultSection.description) {
 existingSection.description = defaultSection.description;
sectionsChanged = true;
 }}
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
module.exports = { Question, QuestionPaper };