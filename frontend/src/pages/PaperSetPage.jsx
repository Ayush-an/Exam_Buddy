import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function PaperSetPage() {
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSetQuestions, setSelectedSetQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetInfo, setCurrentSetInfo] = useState(null);

  useEffect(() => {
    const fetchAllQuestionPapers = async () => {
      try {
        setLoading(true);
        // This endpoint returns all categories, sections, and sets
        const res = await axios.get(`${API_BASE_URL}/api/question-papers`);
        setQuestionPapers(res.data);
      } catch (err) {
        console.error('Error fetching question papers:', err.response ? err.response.data : err);
        setError('Failed to load question papers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllQuestionPapers();
  }, []);

  // Function to fetch questions for a specific set
  const fetchQuestionsForSet = async (category, sectionName, setName) => {
    try {

      setSelectedSetQuestions([]);
      setError(null);
      setCurrentSetInfo({ category, sectionName, setName });

      const res = await axios.get(`${API_BASE_URL}/api/questions/${category}/${sectionName}/${setName}`);
      setSelectedSetQuestions(res.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching questions for set:', err.response ? err.response.data : err);
      setError(`Failed to load questions for set "${setName}". ${err.response?.data?.message || err.message}`);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSetQuestions([]);
    setCurrentSetInfo(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading question papers...</p>
      </div>
    );
  }

  if (error && !isModalOpen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  // Retrieve current admin from localStorage (set during sign-in)
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const isAdminModerator = admin.role === 'moderator';

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl p-8 mx-auto bg-white rounded-lg shadow-md">
        <h2 className="mb-8 text-3xl font-extrabold text-center text-gray-800">
          {isAdminModerator ? "Moderator's Paper Sets Overview" : "Question Papers Overview"}
        </h2>

        {questionPapers.length === 0 ? (
          <p className="text-lg text-center text-gray-600">No question papers found.</p>
        ) : (
          <div className="space-y-8">
            {questionPapers.map(paper => (
              <div key={paper.category} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="mb-4 text-2xl font-bold text-blue-700">{paper.category}</h3>
                {paper.sections && paper.sections.length > 0 ? (
                  <div className="space-y-6">
                    {paper.sections.map(section => (
                      <div key={section.name} className="py-2 pl-4 border-l-4 border-blue-400">
                        <h4 className="mb-2 text-xl font-semibold text-gray-800">{section.name} Section</h4>
                        <p className="mb-2 text-sm text-gray-600">{section.description}</p>
                        {section.isPaid && <span className="mr-2 text-sm font-medium text-purple-600">Paid</span>}
                        {section.hasTimeLimit && <span className="text-sm font-medium text-orange-600">{section.timeLimitMinutes} min time limit</span>}

                        {section.sets && section.sets.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 mt-3 md:grid-cols-2 lg:grid-cols-3">
                            {section.sets.map(set => (
                              <div key={set.name} className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
                                <p className="text-lg font-medium text-gray-900">Set Name: {set.name}</p>
                                {set.timeLimitMinutes && (
                                  <p className="text-sm text-gray-700">Time Limit: {set.timeLimitMinutes} minutes</p>
                                )}
                                {!set.timeLimitMinutes && (
                                  <p className="text-sm italic text-gray-500">No specific time limit for this set.</p>
                                )}
                                <button
                                  onClick={() => fetchQuestionsForSet(paper.category, section.name, set.name)}
                                  className="w-full px-4 py-2 mt-3 text-sm font-medium text-white transition duration-150 ease-in-out bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                  View Questions
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 italic text-gray-500">No sets defined for this section.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-gray-500">No sections defined for this category.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-75">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={closeModal}
              className="absolute text-2xl font-bold text-gray-500 top-3 right-3 hover:text-gray-700"
            >
              &times;
            </button>
            <h3 className="mb-4 text-2xl font-bold text-center text-gray-800">
              Questions for Set: {currentSetInfo?.setName || 'N/A'}
              {currentSetInfo && <p className="text-base font-normal text-gray-600">({currentSetInfo.category} &gt; {currentSetInfo.sectionName})</p>}
            </h3>

            {error && <p className="mb-4 text-center text-red-600">{error}</p>}

            {!error && selectedSetQuestions.length === 0 ? (
              <p className="text-center text-gray-600">No questions found for this set.</p>
            ) : (
              <div className="space-y-6">
                {selectedSetQuestions.map((question, qIndex) => (
                  <div key={question._id || qIndex} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                    <p className="mb-2 text-lg font-semibold">Q{qIndex + 1}: {question.questionText}</p>
                    {question.questionImage && (
                      <img src={`${API_BASE_URL}/${question.questionImage}`} alt="Question visual" className="h-auto max-w-full mb-2 rounded-md" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x200/cccccc/000000?text=Image+Not+Found"; }}/>
                    )}
                    {question.questionAudio && (
                      <audio controls src={`${API_BASE_URL}/${question.questionAudio}`} className="w-full mb-2">
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    <ul className="pl-5 space-y-1 list-disc">
                      {question.options.map((option, oIndex) => (
                        <li key={oIndex} className={`${String.fromCharCode(97 + oIndex) === question.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-800'}`}>
                          <span className="font-bold">{String.fromCharCode(65 + oIndex)}.</span>{' '}
                          {option.type === 'text' && <span>{option.content}</span>}
                          {option.type === 'image' && (
                            <img src={`${API_BASE_URL}/${option.content}`} alt={`Option ${String.fromCharCode(65 + oIndex)}`} className="inline-block max-w-[100px] max-h-[100px] rounded" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100/cccccc/000000?text=Option+Image"; }}/>
                          )}
                          {option.type === 'audio' && (
                            <audio controls src={`${API_BASE_URL}/${option.content}`} className="inline-block w-3/4">
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {String.fromCharCode(97 + oIndex) === question.correctAnswer && <span className="ml-2 text-xs">(Correct Answer)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}