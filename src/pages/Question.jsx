import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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

  const [form, setForm] = useState({
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
  });
  const categories = ['Beginner', 'Intermediate', 'Advanced'];
  const fetchSets = useCallback(async (category, section) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/question-papers/${category}/sections/${section}/sets`);
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
  useEffect(() => {
    if (form.category) {
      setSections(sectionMap[form.category] || []);
      setForm(prev => ({ ...prev, section: '', set: '' }));
      setSets([]);
    } else {
      setSections([]);
      setSets([]);
      setForm(prev => ({ ...prev, section: '', set: '' }));
    }
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
  }, [form.category]);
  useEffect(() => {
    if (form.category && form.section) {
      fetchSets(form.category, form.section);
    } else {
      setSets([]);
      setForm(prev => ({ ...prev, set: '' }));
      setSetTimeLimit('');
    }
  }, [form.category, form.section, fetchSets]);
  const createSet = async () => {
    if (!newSetName.trim()) return alert('Set name is required');
    try {
      const payload = { name: newSetName.trim() };
      if (setTimeLimit !== '' && setTimeLimit !== null) {
        payload.timeLimitMinutes = Number(setTimeLimit);
      }
      // API call to add the new set
      await axios.post(`http://localhost:3000/api/question-papers/${form.category}/sections/${form.section}/sets`, payload);
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
  const updateTimeLimit = async () => {
    if (!form.set) {
      return alert('Please select a set to update its time limit.');
    }
    try {
      await axios.patch(
        `http://localhost:3000/api/question-papers/${form.category}/sections/${form.section}/sets/${form.set}/time-limit`,
        { timeLimitMinutes: Number(setTimeLimit) } // Send timeLimitMinutes to backend
      );
      alert('✅ Time limit updated');
      fetchSets(form.category, form.section); // Re-fetch sets to reflect changes in UI
    } catch (err) {
      console.error('❌ Failed to update time limit:', err.response ? err.response.data : err);
      alert(`❌ Failed to update time limit: ${err.response ? err.response.data.message : err.message}`);
    }
  };
  const deleteTimeLimit = async () => {
    if (!form.set) {
      return alert('Please select a set to delete its time limit.');
    }
    try {
      // API call to delete the time limit for the selected set
      await axios.delete(
        `http://localhost:3000/api/question-papers/${form.category}/sections/${form.section}/sets/${form.set}/time-limit`
      );
      alert('✅ Time limit deleted');
      setSetTimeLimit(''); // Clear time limit input field
      fetchSets(form.category, form.section); // Re-fetch sets to update UI
    } catch (err) {
      console.error('❌ Failed to delete time limit:', err.response ? err.response.data : err);
      alert(`❌ Failed to delete time limit: ${err.response ? err.response.data.message : err.message}`);
    }
  };
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
    }));
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
  };
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
    }));
    setCreateNewSet(false);
    setNewSetName('');
    setSetTimeLimit('');
  };
  const handleSetChange = async (e) => {
    const selectedSetName = e.target.value;
    setForm(prev => ({ ...prev, set: selectedSetName }));
    const currentSet = sets.find(s => s.name === selectedSetName);
    if (currentSet) {
      setSetTimeLimit(String(currentSet.timeLimitMinutes || ''));
    } else {
      setSetTimeLimit('');
    }
  };
    const handleOptionChange = (index, field, value, isFile = false) => {
    const updatedOptions = [...form.options];
      updatedOptions[index][field] = isFile ? value : value;
    setForm({ ...form, options: updatedOptions });
  };
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      setForm({ ...form, [name]: files[0] }); // For file inputs, store the File object
    } else {
      setForm({ ...form, [name]: value }); // For text/select inputs, store the value
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.section || !form.set || !form.questionText || form.options.some(opt => !opt.content) || !form.correctAnswer) {
      return alert('Please fill in all required fields (Category, Section, Set, Question Text, Options, Correct Answer).');
    }
    const formData = new FormData();
    formData.append('category', form.category);
    formData.append('section', form.section);
    formData.append('set', form.set);
    formData.append('questionText', form.questionText);
    if (form.questionImage) formData.append('questionImage', form.questionImage);
    if (form.questionAudio) formData.append('questionAudio', form.questionAudio);
   formData.append('correctAnswer', form.correctAnswer);
   form.options.forEach((opt, idx) => {
      const contentValue = opt.type === 'text' ? opt.content : (opt.content instanceof File ? opt.content : null);
      if (contentValue) {
        formData.append(`options[${idx}][type]`, opt.type);
        formData.append(`options[${idx}][content]`, contentValue);
      }
    });
    try {
      // API call to create the question
      await axios.post('http://localhost:3000/api/questions/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Important for FormData
        
      });
      
      alert('✅ Question created successfully!');
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
      });
      setSections([]);
      setSets([]);
      setCreateNewSet(false);
      setNewSetName('');
      setSetTimeLimit('');
    } catch (err) {
      console.error('❌ Error submitting question:', err.response ? err.response.data : err);
      alert(`❌ Error submitting question: ${err.response ? err.response.data.message : err.message}`);
    }
  };
  return (
    <div className="max-w-4xl p-6 mx-auto bg-white rounded shadow-lg">
      <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-800">Create New Question</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleCategoryChange}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
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
            <label htmlFor="section" className="block mb-1 text-sm font-medium text-gray-700">Section</label>
            <select
              id="section"
              name="section"
              value={form.section}
              onChange={handleSectionChange}
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
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
          <div className="p-4 rounded-md shadow-sm bg-gray-50">
            <label className="block mb-2 text-sm font-medium text-gray-700">Set</label>
            {!createNewSet ? (
              <>
                <select
                  name="set"
                  value={form.set}
                  onChange={handleSetChange}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
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
                  }}
                  className="px-4 py-2 mt-3 text-sm font-medium text-blue-600 transition duration-150 ease-in-out rounded-md bg-blue-50 hover:bg-blue-100"
                >
                  + Create New Set
                </button>

                {form.set && (
                  
                  <div className="p-3 mt-4 space-y-3 bg-white border border-gray-200 rounded-md">
                    <label className="block text-sm font-medium text-gray-700">Update Set Time Limit (in minutes)</label>
                    <input
                      type="number"
                      placeholder="Enter time limit"
                      value={setTimeLimit || ''}
                      onChange={(e) => setSetTimeLimit(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={updateTimeLimit}
                        className="justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Update Time Limit
                      </button>
                      <button
                        type="button"
                        onClick={deleteTimeLimit}
                        className="justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete Time Limit
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 mt-2 space-y-3 bg-white border border-gray-200 rounded-md shadow-sm">
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={createSet}
                    className="justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Create Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateNewSet(false)}
                    className="justify-center flex-1 px-4 py-2 text-sm font-medium text-gray-700 transition duration-150 ease-in-out bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question Text */}
        <div>
          <label htmlFor="questionText" className="block mb-1 text-sm font-medium text-gray-700">Question Text</label>
          <input
            type="text"
            id="questionText"
            name="questionText"
            value={form.questionText}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          />
        </div>

        {/* Question Image */}
        <div>
          <label htmlFor="questionImage" className="block mb-1 text-sm font-medium text-gray-700">Question Image</label>
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
          <label htmlFor="questionAudio" className="block mb-1 text-sm font-medium text-gray-700">Question Audio</label>
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
          <label className="block mb-2 text-sm font-medium text-gray-700">Options</label>
          {form.options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 mb-3 border border-gray-200 rounded-md bg-gray-50">
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
                  placeholder={`Option ${String.fromCharCode(97 + idx).toUpperCase()}`}
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
          <label htmlFor="correctAnswer" className="block mb-1 text-sm font-medium text-gray-700">Correct Answer</label>
          <select
            id="correctAnswer"
            name="correctAnswer"
            value={form.correctAnswer}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          >
            {form.options.map((_, idx) => (
              <option key={String.fromCharCode(97 + idx)} value={String.fromCharCode(97 + idx)}>
                {String.fromCharCode(65 + idx)}
              </option>
            ))}
          </select>
        </div>

        {/* Associated Set Timer Information */}
        <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
          <h3 className="mb-2 text-lg font-semibold text-blue-800">Associated Set Timer</h3>
          {setTimeLimit ? (
            <p className="text-sm text-blue-700">
              This question will inherit the time limit from its selected set: <strong className="font-bold text-blue-900">{setTimeLimit} minutes</strong>.
            </p>
          ) : (
            <p className="text-sm text-blue-700">
              The selected set currently has no default time limit. This question will not have an explicit timer unless set in its parent section/category configuration.
            </p>
          )}
          <p className="mt-2 text-xs italic text-blue-600">
            The time limit for questions is managed at the Set level on the backend.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 text-lg font-medium text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Question
        </button>
      </form>
    </div>
  );
};
export default Question;