import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;

const sectionMap = {
  Beginner: ['Beginner', 'Intermediate', 'Advanced', 'Pro Advanced'],
  Intermediate: ['Beginner Challenge', 'Intermediate Challenge', 'Advanced Challenge', 'Pro Advanced Challenge'],
  Advanced: ['Beginner Level', 'Intermediate Level', 'Advanced Level', 'Pro Advanced Level']
};

const Question = () => {
  const [sections, setSections] = useState([]);
  const [sets, setSets] = useState([]);
  const [createNewSet, setCreateNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [setTimeLimit, setSetTimeLimit] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  const [form, setForm] = useState({
    category: '', section: '', set: '', 
    questionText: '',
    questionImage: null,
    questionAudio: null,
    options: [
      { type: 'text', content: '' },
      { type: 'text', content: '' },
      { type: 'text', content: '' },
      { type: 'text', content: '' }
    ],
    correctAnswer: 'a',
    marks: 1,
  });

  // Available categories for selection.
  const categories = ['Beginner', 'Intermediate', 'Advanced'];

  const fetchSets = useCallback(async (category, section) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/question-papers/${category}/sections/${section}/sets`);
      setSets(res.data);

      if (form.set && !res.data.some(s => s.name === form.set)) {
        setForm(prev => ({ ...prev, set: '' }));
        setSetTimeLimit('');
      } else if (form.set) {

        const currentSet = res.data.find(s => s.name === form.set);
        if (currentSet) {
          setSetTimeLimit(String(currentSet.timeLimitMinutes || ''));
        } else {
          setSetTimeLimit('');
        }
      }
    } catch (err) {
      console.error('Error fetching sets:', err.response ? err.response.data : err);
      setSets([]);
      setForm(prev => ({ ...prev, set: '' }));
      setSetTimeLimit('');
    }
  }, [form.set]);

  // Effect to update sections when the category changes.
  useEffect(() => {
    if (form.category) {
      setSections(sectionMap[form.category] || []);

      setForm(prev => ({ ...prev, section: '', set: '', questionText: '', questionImage: null, questionAudio: null, options: [{ type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }], correctAnswer: 'a', marks: 1 }));
      setSets([]);
    } else {
      setSections([]);
      setSets([]);
      setForm(prev => ({ ...prev, section: '', set: '', questionText: '', questionImage: null, questionAudio: null, options: [{ type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }], correctAnswer: 'a', marks: 1 }));
    }
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
    setExcelFile(null);
  }, [form.category]);

  // Effect to fetch sets when category or section changes.
  useEffect(() => {
    if (form.category && form.section) {
      fetchSets(form.category, form.section);
    } else {
      setSets([]);
      setForm(prev => ({ ...prev, set: '', questionText: '', questionImage: null, questionAudio: null, options: [{ type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }, { type: 'text', content: '' }], correctAnswer: 'a', marks: 1 }));
      setSetTimeLimit('');
    }
    setExcelFile(null);
  }, [form.category, form.section, fetchSets]);

  /**
   * Handles the creation of a new set.
   * Sends a POST request to the backend to add the set.
   */
  const createSet = async () => {
    if (!newSetName.trim()) return alert('Set name is required');
    try {
      const payload = { name: newSetName.trim() };
      if (setTimeLimit !== '' && setTimeLimit !== null) {
        payload.timeLimitMinutes = Number(setTimeLimit);
      }
      // API call to add the new set
      await axios.post(`${API_BASE_URL}/api/question-papers/${form.category}/sections/${form.section}/sets`, payload);
      alert('✅ Set created successfully');
      setCreateNewSet(false);
      setForm(prev => ({ ...prev, set: newSetName.trim() }));
      setNewSetName('');
      setSetTimeLimit('');
      fetchSets(form.category, form.section);
    } catch (err) {
      console.error('❌ Failed to create set:', err.response ? err.response.data : err);
      alert(`❌ Failed to create set: ${err.response ? err.response.data.message : err.message}`);
    }
  };

  /**
   * Updates the time limit for the currently selected set.
   * Sends a PATCH request to the backend.
   */
  const updateTimeLimit = async () => {
    if (!form.set) {
      return alert('Please select a set to update its time limit.');
    }
    try {
      await axios.patch(
        `${API_BASE_URL}/api/question-papers/${form.category}/sections/${form.section}/sets/${form.set}/time-limit`,
        { timeLimitMinutes: Number(setTimeLimit) }
      );
      alert('✅ Time limit updated');
      fetchSets(form.category, form.section);
    } catch (err) {
      console.error('❌ Failed to update time limit:', err.response ? err.response.data : err);
      alert(`❌ Failed to update time limit: ${err.response ? err.response.data.message : err.message}`);
    }
  };

  /**
   * Deletes the time limit for the currently selected set.
   * Sends a DELETE request to the backend.
   */
  const deleteTimeLimit = async () => {
    if (!form.set) {
      return alert('Please select a set to delete its time limit.');
    }
    try {
      // API call to delete the time limit for the selected set
      await axios.delete(
        `${API_BASE_URL}/api/question-papers/${form.category}/sections/${form.section}/sets/${form.set}/time-limit`
      );
      alert('✅ Time limit deleted');
      setSetTimeLimit('');
      fetchSets(form.category, form.section);
    } catch (err) {
      console.error('❌ Failed to delete time limit:', err.response ? err.response.data : err);
      alert(`❌ Failed to delete time limit: ${err.response ? err.response.data.message : err.message}`);
    }
  };

  /**
   * Handles changes in the category dropdown.
   * Resets section, set, and question-related form fields.
   */
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setForm(prev => ({
      ...prev,
      category: selectedCategory,
      section: '',
      set: '',
      questionText: '',
      questionImage: null,
      questionAudio: null,
      options: [
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' }
      ],
      correctAnswer: 'a',
      marks: 1,
    }));
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
    setExcelFile(null);
  };

  /**
   * Handles changes in the section dropdown.
   * Resets set and question-related form fields.
   */
  const handleSectionChange = (e) => {
    const selectedSection = e.target.value;
    setForm(prev => ({
      ...prev,
      section: selectedSection,
      set: '',
      questionText: '',
      questionImage: null,
      questionAudio: null,
      options: [
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' },
        { type: 'text', content: '' }
      ],
      correctAnswer: 'a',
      marks: 1,
    }));
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
    setExcelFile(null);
  };

  /**
   * Handles changes in the set dropdown.
   * Updates the form's set and the setTimeLimit state based on the selected set.
   */
  const handleSetChange = async (e) => {
    const selectedSetName = e.target.value;
    setForm(prev => ({ ...prev, set: selectedSetName }));
    const currentSet = sets.find(s => s.name === selectedSetName);
    if (currentSet) {
      setSetTimeLimit(String(currentSet.timeLimitMinutes || ''));
    } else {
      setSetTimeLimit('');
    }
    setExcelFile(null);
  };

  /**
   * Handles changes for individual options (text, image, audio).
   * @param {number} index The index of the option being changed.
   * @param {string} field The field within the option ('type' or 'content').
   * @param {*} value The new value for the field.
   * @param {boolean} isFile Indicates if the content is a file.
   */
  const handleOptionChange = (index, field, value, isFile = false) => {
    const updatedOptions = [...form.options];
    updatedOptions[index][field] = isFile ? value : value;
    setForm({ ...form, options: updatedOptions });
  };

  /**
   * Handles general form input changes (question text, question image/audio, correct answer, marks).
   * @param {Event} e The event object from the input change.
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] }); // For file inputs, store the File object
    } else {
      // For number inputs, convert value to a number
      setForm({ ...form, [name]: name === 'marks' ? Number(value) : value });
    }
  };

  /**
   * Handles the submission of a single question.
   * Creates FormData to send files and text data.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.section || !form.set || !form.questionText || form.options.some(opt => !opt.content) || !form.correctAnswer || form.marks === '' || form.marks === null || form.marks < 0) {
      return alert('Please fill in all required fields (Category, Section, Set, Question Text, Options, Correct Answer, Marks), and ensure Marks is a non-negative number.');
    }

    const formData = new FormData();
    formData.append('category', form.category);
    formData.append('section', form.section);
    formData.append('set', form.set);
    formData.append('questionText', form.questionText);
    if (form.questionImage) formData.append('questionImage', form.questionImage);
    if (form.questionAudio) formData.append('questionAudio', form.questionAudio);
    formData.append('correctAnswer', form.correctAnswer);
    formData.append('marks', form.marks);

    form.options.forEach((opt, idx) => {
      const contentValue = opt.type === 'text' ? opt.content : (opt.content instanceof File ? opt.content : null);
      if (contentValue) {
        formData.append(`options[${idx}][type]`, opt.type);
        formData.append(`options[${idx}][content]`, contentValue);
      }
    });

    try {
      // API call to create the question
      await axios.post(`${API_BASE_URL}/api/questions/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('✅ Question created successfully!');
      // Reset form fields after successful submission
      setForm({
        category: '',
        section: '',
        set: '',
        questionText: '',
        questionImage: null,
        questionAudio: null,
        options: [
          { type: 'text', content: '' },
          { type: 'text', content: '' },
          { type: 'text', content: '' },
          { type: 'text', content: '' }
        ],
        correctAnswer: 'a',
        marks: 1,
      });
      setSections([]);
      setSets([]);
      setCreateNewSet(false);
      setNewSetName('');
      setSetTimeLimit('');
      setExcelFile(null);
    } catch (err) {
      console.error('❌ Error submitting question:', err.response ? err.response.data : err);
      alert(`❌ Error submitting question: ${err.response ? err.response.data.message : err.message}`);
    }
  };

  /**
   * Handles the selection of an Excel file for bulk upload.
   * @param {Event} e The event object from the file input change.
   */
  const handleExcelFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  /**
   * Handles the submission of the Excel file for bulk question creation.
   * Sends a POST request to the new backend endpoint.
   */
  const handleExcelUpload = async () => {
    if (!excelFile) {
      return alert('Please select an Excel file to upload.');
    }
    if (!form.category || !form.section || !form.set) {
      return alert('Please select a Category, Section, and Set before uploading an Excel file.');
    }

    setIsUploadingExcel(true);
    const excelFormData = new FormData();
    excelFormData.append('excelFile', excelFile);
    excelFormData.append('category', form.category);
    excelFormData.append('section', form.section);
    excelFormData.append('set', form.set);

    try {
      await axios.post(`${API_BASE_URL}/api/questions/bulk-upload`, excelFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Excel file uploaded successfully! Questions will be processed.');
      setExcelFile(null);
    } catch (err) {
      console.error('❌ Error uploading Excel file:', err.response ? err.response.data : err);
      alert(`❌ Error uploading Excel file: ${err.response ? err.response.data.message : err.message}`);
    } finally {
      setIsUploadingExcel(false);
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto bg-white shadow-2xl rounded-xl font-inter">
      <h2 className="mb-8 text-4xl font-extrabold text-center text-gray-900">Create New Question</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block mb-2 text-base font-semibold text-gray-700">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleCategoryChange}
            className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm appearance-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Section Selection (conditionally rendered) */}
        {form.category && sections.length > 0 && (
          <div>
            <label htmlFor="section" className="block mb-2 text-base font-semibold text-gray-700">Section</label>
            <select
              id="section"
              name="section"
              value={form.section}
              onChange={handleSectionChange}
              className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm appearance-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Section --</option>
              {sections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
        )}

        {/* Set Management (conditionally rendered) */}
        {form.section && (
          <div className="p-6 border border-gray-200 shadow-inner rounded-xl bg-gray-50">
            <label className="block mb-3 text-base font-semibold text-gray-700">Set</label>
            {!createNewSet ? (
              <>
                <select
                  name="set"
                  value={form.set}
                  onChange={handleSetChange}
                  className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm appearance-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select Set --</option>
                  {sets.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setCreateNewSet(true);
                    setNewSetName('');
                    setSetTimeLimit('');
                    setExcelFile(null);
                  }}
                  className="px-6 py-2 mt-4 text-sm font-medium text-blue-700 transition duration-150 ease-in-out bg-blue-100 rounded-lg shadow-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Create New Set
                </button>

                {form.set && (
                  <div className="p-4 mt-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-md">
                    <label className="block text-sm font-medium text-gray-700">Update Set Time Limit (in minutes)</label>
                    <input
                      type="number"
                      placeholder="Enter time limit"
                      value={setTimeLimit || ''}
                      onChange={(e) => setSetTimeLimit(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                    />
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={updateTimeLimit}
                        className="flex-1 justify-center px-5 py-2.5 text-base font-medium text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                      >
                        Update Time Limit
                      </button>
                      <button
                        type="button"
                        onClick={deleteTimeLimit}
                        className="flex-1 justify-center px-5 py-2.5 text-base font-medium text-white bg-red-600 rounded-md shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                      >
                        Delete Time Limit
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 mt-4 space-y-4 bg-white border border-gray-200 rounded-lg shadow-md">
                <input
                  type="text"
                  placeholder="Enter new set name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
                <input
                  type="number"
                  placeholder="Optional: Set time limit in minutes"
                  value={setTimeLimit || ''}
                  onChange={(e) => setSetTimeLimit(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  min="0"
                />
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={createSet}
                    className="flex-1 justify-center px-5 py-2.5 text-base font-medium text-white bg-green-600 rounded-md shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                  >
                    Create Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateNewSet(false)}
                    className="flex-1 justify-center px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Excel Upload Section (conditionally rendered) */}
        {form.category && form.section && form.set && (
          <div className="p-6 border border-purple-200 shadow-inner rounded-xl bg-purple-50">
            <h3 className="mb-4 text-xl font-bold text-purple-800">Bulk Upload Questions via Excel</h3>
            <p className="mb-4 text-sm text-purple-700">
              You can upload an Excel file (.xlsx or .xls) to add multiple questions at once to the selected Category, Section, and Set.
              Please ensure your Excel file includes columns for: `questionText`, `optionA`, `optionB`, `optionC`, `optionD`, `correctAnswer`, and **`marks`**.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="excelFile"
                name="excelFile"
                accept=".xlsx, .xls"
                onChange={handleExcelFileChange}
                className="flex-1 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
              <button
                type="button"
                onClick={handleExcelUpload}
                disabled={!excelFile || isUploadingExcel}
                className={`px-6 py-2.5 text-base font-medium text-white rounded-md shadow-lg transition duration-150 ease-in-out
                  ${!excelFile || isUploadingExcel ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'}`}
              >
                {isUploadingExcel ? 'Uploading...' : 'Upload Excel'}
              </button>
            </div>
            {excelFile && <p className="mt-2 text-sm text-gray-600">Selected file: {excelFile.name}</p>}
          </div>
        )}

        {/* Single Question Form Starts Here */}
        <h3 className="pt-4 mb-4 text-xl font-bold text-gray-800 border-t border-gray-200">Add Single Question</h3>

        {/* Question Text */}
        <div>
          <label htmlFor="questionText" className="block mb-2 text-base font-semibold text-gray-700">Question Text</label>
          <input
            type="text"
            id="questionText"
            name="questionText"
            value={form.questionText}
            onChange={handleChange}
            className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Question Image */}
        <div>
          <label htmlFor="questionImage" className="block mb-2 text-base font-semibold text-gray-700">Question Image</label>
          <input
            type="file"
            id="questionImage"
            name="questionImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Question Audio */}
        <div>
          <label htmlFor="questionAudio" className="block mb-2 text-base font-semibold text-gray-700">Question Audio</label>
          <input
            type="file"
            id="questionAudio"
            name="questionAudio"
            accept="audio/*"
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block mb-3 text-base font-semibold text-gray-700">Options</label>
          {form.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 mb-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
              <select
                value={option.type}
                onChange={(e) => handleOptionChange(idx, 'type', e.target.value)}
                className="p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
              </select>
              {option.type === 'text' ? (
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={option.content}
                  onChange={(e) => handleOptionChange(idx, 'content', e.target.value)}
                  className="flex-1 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              ) : (
                <input
                  type="file"
                  accept={option.type === 'image' ? 'image/*' : 'audio/*'}
                  onChange={(e) => handleOptionChange(idx, 'content', e.target.files[0], true)}
                  className="flex-1 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>
          ))}
        </div>

        {/* Correct Answer Selection */}
        <div>
          <label htmlFor="correctAnswer" className="block mb-2 text-base font-semibold text-gray-700">Correct Answer</label>
          <select
            id="correctAnswer"
            name="correctAnswer"
            value={form.correctAnswer}
            onChange={handleChange}
            className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm appearance-none focus:ring-blue-500 focus:border-blue-500"
          >
            {form.options.map((_, idx) => (
              <option key={String.fromCharCode(97 + idx)} value={String.fromCharCode(97 + idx)}>
                {String.fromCharCode(65 + idx)}
              </option>
            ))}
          </select>
        </div>

        {/* Marks Input Field */}
        <div>
          <label htmlFor="marks" className="block mb-2 text-base font-semibold text-gray-700">Marks</label>
          <input
            type="number"
            id="marks"
            name="marks"
            value={form.marks}
            onChange={handleChange}
            min="0"
            className="w-full p-3 transition duration-200 ease-in-out border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter marks for this question"
          />
        </div>


        {/* Associated Set Timer Information */}
        <div className="p-5 border border-blue-200 rounded-xl bg-blue-50">
          <h3 className="mb-3 text-lg font-semibold text-blue-800">Associated Set Timer</h3>
          {setTimeLimit ? (
            <p className="text-sm text-blue-700">
              This question will inherit the time limit from its selected set: <strong className="font-bold text-blue-900">{setTimeLimit} minutes</strong>.
            </p>
          ) : (
            <p className="text-sm text-blue-700">
              The selected set currently has no default time limit. This question will not have an explicit timer unless set in its parent section/category configuration.
            </p>
          )}
          <p className="mt-3 text-xs italic text-blue-600">
            The time limit for questions is managed at the Set level on the backend.
          </p>
        </div>

        {/* Submit Button for Single Question */}
        <button
          type="submit"
          className="w-full px-8 py-3 text-lg font-bold text-white transition duration-200 ease-in-out transform bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:scale-105"
        >
          Submit Single Question
        </button>
      </form>
    </div>
  );
};
export default Question;