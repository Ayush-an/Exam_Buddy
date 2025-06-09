import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Centralized Axios instance (consider moving this to a separate config file if it grows)
const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export default function AnswerPage() {
  const navigate = useNavigate();

  // --- State Management ---
  const [user, setUser] = useState(null);
  const [isUserPaid, setIsUserPaid] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('categorySelection');
  const [allExamData, setAllExamData] = useState([]);

  // Selections
  const [selectedExam, setSelectedExam] = useState({
    category: '',
    section: '',
    set: '',
    timeLimitMinutes: 0,
  });

  // Exam specific states
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // Stores { questionId: 'selectedOptionLetter' }
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0); // State for correct answers
  const [startTime, setStartTime] = useState(null); // Keep track of exam start time
  const timerIntervalRef = useRef(null);

  // Post-exam states
  const [examResult, setExamResult] = useState(null);
  const [examDetailsForReview, setExamDetailsForReview] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Initial Load & User Check ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      toast.error('Please sign in to access the exam page.');
      navigate('/user-signin');
      return;
    }

    setUser(storedUser);
    const now = new Date();
    const hasActivePaidSubscription = storedUser.subscriptions?.some(sub =>
      sub.status === 'active' &&
      new Date(sub.startDate) <= now &&
      new Date(sub.endDate) >= now &&
      sub.planName !== 'Free'
    );
    setIsUserPaid(hasActivePaidSubscription);

    fetchAllExamData();
  }, [navigate]);

  // --- Helper for Access Control Logic ---
  const isSectionAccessibleForFreeUser = useCallback((categoryName, sectionName) => {
    switch (categoryName) {
      case 'Beginner': return sectionName === 'Beginner';
      case 'Intermediate': return sectionName === 'Beginner Challenge';
      case 'Advanced': return sectionName === 'Beginner Level';
      default: return false;
    }
  }, []); // No dependencies here, as logic is static

  // --- Fetching All Exam Data ---
  const fetchAllExamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/question-papers');
      setAllExamData(res.data);
    } catch (err) {
      console.error('Error fetching exam data:', err);
      setError('Failed to load exam data. Please try again.');
      toast.error('Failed to load exam data.');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Selection Changes ---
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedExam({ category, section: '', set: '', timeLimitMinutes: 0 });
  };

  const handleSectionChange = (e) => {
    const section = e.target.value;
    setSelectedExam(prev => ({ ...prev, section, set: '', timeLimitMinutes: 0 }));
  };

  const handleSetChange = (e) => {
    const setName = e.target.value;
    const currentCategory = allExamData.find(cat => cat.category === selectedExam.category);
    const currentSection = currentCategory?.sections.find(sec => sec.name === selectedExam.section);
    const selectedSetObject = currentSection?.sets.find(set => set.name === setName);
    setSelectedExam(prev => ({
      ...prev,
      set: setName,
      timeLimitMinutes: selectedSetObject ? (selectedSetObject.timeLimitMinutes || 0) : 0,
    }));
  };

  const calculateTimeTaken = useCallback(() => {
    if (!startTime) return 0;
    const endTime = new Date();
    return Math.floor((endTime - startTime) / 1000); // Time in seconds
  }, [startTime]); // Dependency: startTime

  // Consolidated and corrected submitExam using useCallback
  // Define submitExam before the useEffect that calls it
  const submitExam = useCallback(async (timeUp = false) => {
    clearInterval(timerIntervalRef.current); // Ensure timer stops immediately on manual submit
    setLoading(true);
    setError(null);

    let currentScore = 0;
    let currentCorrectAnswersCount = 0;
    const totalQuestions = questions.length;
    const calculatedDuration = calculateTimeTaken(); // Use the memoized function

    const answersForSubmission = questions.map(q => {
      const selected = userAnswers[q._id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) {
        currentScore += 1;
        currentCorrectAnswersCount += 1;
      }
      return { questionId: q._id, selectedOption: selected, isCorrect };
    });

    setCorrectAnswersCount(currentCorrectAnswersCount); // Update state with the calculated count

    const examAttemptData = {
      userId: user?._id, // Ensure user and _id exist
      category: selectedExam.category,
      section: selectedExam.section,
      set: selectedExam.set,
      examAttemptId: new Date().toISOString(), // Unique ID for this attempt
      score: currentScore,
      totalQuestions: totalQuestions,
      correctAnswers: currentCorrectAnswersCount,
      duration: calculatedDuration,
      answers: answersForSubmission,
    };

    console.log('Frontend Sending Exam Attempt Data:', examAttemptData);

    try {
      const response = await API.post('/user/exam-history', examAttemptData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Ensure token is sent
        }
      });

      setExamResult({
        score: response.data.examResult.score,
        totalQuestions: response.data.examResult.totalQuestions,
        correctAnswersCount: response.data.examResult.correctAnswers,
        timeTaken: response.data.examResult.duration,
        timeUp,
        examAttemptId: response.data.examResult.examId
      });

      setCurrentPhase('examSubmitted');
      toast.success('Exam submitted successfully!' + (timeUp ? ' Time ran out.' : ''));

    } catch (err) {
      console.error('Error submitting exam:', err.response ? err.response.data : err);
      setError(`Failed to submit exam: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to submit exam: ${err.response?.data?.message || err.message}`);
      setCurrentPhase('examSubmitted'); // Still transition to submitted phase to show score, even if saving failed
    } finally {
      setLoading(false);
    }
  }, [
    user,
    selectedExam.category,
    selectedExam.section,
    selectedExam.set,
    questions,
    userAnswers,
    calculateTimeTaken,
    setError,
    setCurrentPhase,
    toast, // Include toast if you're using it inside useCallback
    API // API instance is stable, but can be added if ESLint complains.
  ]);


  // This useEffect manages the timer lifecycle
  useEffect(() => {
    if (currentPhase === 'examInProgress' && timeLeft > 0) {
      // Clear any existing timer before setting a new one
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current);
            // Use the functional update form for submitExam if timeUp is always true here,
            // or ensure submitExam is stable. With submitExam as a useCallback, it is stable.
            submitExam(true); // Auto-submit when time's up
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    // Cleanup function: Clear interval when component unmounts or dependencies change
    return () => clearInterval(timerIntervalRef.current);
  }, [currentPhase, timeLeft, submitExam]); // Dependencies for useEffect: currentPhase, timeLeft, and submitExam (the useCallback function)


  // --- Exam Logic ---
  const startExam = async () => {
    const { category, section, set } = selectedExam;
    if (!category || !section || !set) {
      toast.warn('Please select a Category, Section, and Set to start the exam.');
      return;
    }

    const currentCategoryData = allExamData.find(cat => cat.category === category);
    const currentSectionData = currentCategoryData?.sections.find(sec => sec.name === section);

    if (currentSectionData && !isUserPaid && !isSectionAccessibleForFreeUser(category, section)) {
      toast.error('This section is only available for Paid subscribers. Please upgrade your plan or choose a free section.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const questionsRes = await API.get(`/questions/${category}/${section}/${set}`);
      setQuestions(questionsRes.data);

      const timeLimitInMinutes = selectedExam.timeLimitMinutes;
      setTimeLeft(timeLimitInMinutes * 60);
      setStartTime(new Date()); // Record start time when exam begins

      const initialUserAnswers = {};
      questionsRes.data.forEach(q => {
        initialUserAnswers[q._id] = null;
      });
      setUserAnswers(initialUserAnswers);

      setCurrentPhase('examInProgress');
      // The useEffect for the timer will now pick up the 'examInProgress' phase change.
    } catch (err) {
      console.error('Error starting exam:', err.response ? err.response.data : err);
      setError(`Failed to load exam questions: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to load exam: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId, optionLetter) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: optionLetter
    }));
  };

  const viewAnswers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?._id || !examResult?.examAttemptId) {
        toast.error('Cannot retrieve review data: User ID or Exam Attempt ID missing.');
        setLoading(false);
        return;
      }

      const res = await API.get(`/user/exam-history/${user._id}/${examResult.examAttemptId}`);
      setExamDetailsForReview(res.data.reviewData);
      setCurrentPhase('viewAnswers');
    } catch (err) {
      console.error('Error fetching answers for review:', err.response ? err.response.data : err);
      setError(`Failed to load answers for review: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to load answers: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetExamFlow = () => {
    setCurrentPhase('categorySelection');
    setQuestions([]);
    setUserAnswers({});
    setExamResult(null);
    setExamDetailsForReview(null);
    setError(null);
    setSelectedExam({ category: '', section: '', set: '', timeLimitMinutes: 0 });
    clearInterval(timerIntervalRef.current);
    setTimeLeft(0);
    setStartTime(null); // Reset start time
    setCorrectAnswersCount(0); // Reset correct answers count
  };

  // --- Helper Components for Rendering Questions/Options ---
  const MediaDisplay = ({ src, type, alt, className }) => {
    if (!src) return null;
    const fullSrc = `http://localhost:3000/${src}`; // Ensure this path is correct for your served media
    const handleError = (e) => {
      e.target.onerror = null;
      e.target.style.display = 'none';
    };

    if (type === 'image') {
      return <img src={fullSrc} alt={alt} className={className} onError={handleError} />;
    }
    if (type === 'audio') {
      return (
        <audio controls src={fullSrc} className={className} onError={handleError}>
          Your browser does not support the audio element.
        </audio>
      );
    }
    return null;
  };

  // --- Render Functions for each phase ---
  const renderCategorySelection = () => {
    const categories = allExamData.map(item => item.category);
    const sections = allExamData.find(cat => cat.category === selectedExam.category)?.sections || [];
    const sets = allExamData.find(cat => cat.category === selectedExam.category)
      ?.sections.find(sec => sec.name === selectedExam.section)?.sets || [];

    return (
      <div className="max-w-xl p-6 mx-auto space-y-4 bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">Select Exam Paper</h2>
        {user && (
          <p className="text-sm text-center text-gray-600">
            Welcome, <span className="font-semibold">{user.firstName}</span>! Your subscription status: <strong className={isUserPaid ? 'text-green-600' : 'text-red-600'}>
              {isUserPaid ? 'Paid' : 'Free'}
            </strong>
            {isUserPaid && user.subscriptions?.length > 0 &&
              ` (${user.subscriptions.find(sub => sub.status === 'active')?.planName || 'Active Plan'})`}
          </p>
        )}
        {error && <p className="text-center text-red-600">{error}</p>}

        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={selectedExam.category}
            onChange={handleCategoryChange}
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            disabled={loading}
          >
            <option value="">-- Select Category --</option>
            {categories.map(catName => {
              const categoryData = allExamData.find(cat => cat.category === catName);
              const hasAccessibleSectionInThisCategory = categoryData?.sections.some(sec =>
                isUserPaid || isSectionAccessibleForFreeUser(catName, sec.name)
              );
              const isDisabledCategoryOption = !isUserPaid && !hasAccessibleSectionInThisCategory;
              return (
                <option key={catName} value={catName} disabled={isDisabledCategoryOption}>
                  {catName} {isDisabledCategoryOption ? ' (Upgrade Required)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Section Selection */}
        {selectedExam.category && (
          <div>
            <label htmlFor="section" className="block mb-1 text-sm font-medium text-gray-700">Section</label>
            <select
              id="section"
              value={selectedExam.section}
              onChange={handleSectionChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || sections.length === 0}
            >
              <option value="">-- Select Section --</option>
              {sections.map(sec => {
                const isDisabledSectionOption = !isUserPaid && !isSectionAccessibleForFreeUser(selectedExam.category, sec.name);
                return (
                  <option key={sec.name} value={sec.name} disabled={isDisabledSectionOption}>
                    {sec.name} {isDisabledSectionOption ? ' (Paid - Upgrade Required)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Set Selection */}
        {selectedExam.section && (
          <div>
            <label htmlFor="set" className="block mb-1 text-sm font-medium text-gray-700">Set</label>
            <select
              id="set"
              value={selectedExam.set}
              onChange={handleSetChange}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || sets.length === 0}
            >
              <option value="">-- Select Set --</option>
              {sets.map(set => (
                <option key={set.name} value={set.name}>
                  {set.name} {set.timeLimitMinutes ? ` (${set.timeLimitMinutes} min)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={startExam}
          className="w-full px-4 py-2 font-medium text-white transition duration-150 ease-in-out bg-green-600 rounded-md hover:bg-green-700"
          disabled={loading || !selectedExam.set}
        >
          {loading ? 'Loading Exam...' : 'Start Exam'}
        </button>
      </div>
    );
  };

  const renderExamInProgress = () => (
    <div className="max-w-3xl p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">
        Exam: {selectedExam.set} ({selectedExam.category} &gt; {selectedExam.section})
      </h2>
      <div className="mb-4 font-mono text-lg text-right text-gray-700">
        Time Left: <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
      </div>
      {error && <p className="text-center text-red-600">{error}</p>}

      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={question._id} className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="mb-2 text-lg font-semibold">Q{qIndex + 1}: {question.questionText}</p>
            <MediaDisplay
              src={question.questionImage}
              type="image"
              alt="Question visual"
              className="h-auto max-w-full mb-2 rounded-md"
            />
            <MediaDisplay
              src={question.questionAudio}
              type="audio"
              className="w-full mb-2"
            />
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="flex items-center p-2 space-x-2 rounded-md cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={String.fromCharCode(97 + oIndex)}
                    checked={userAnswers[question._id] === String.fromCharCode(97 + oIndex)}
                    onChange={() => handleOptionSelect(question._id, String.fromCharCode(97 + oIndex))}
                    className="w-4 h-4 text-blue-600 form-radio"
                  />
                  <span className="font-bold">{String.fromCharCode(65 + oIndex)}.</span>{' '}
                  {option.type === 'text' && <span>{option.content}</span>}
                  <MediaDisplay
                    src={option.content}
                    type={option.type}
                    alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                    className={option.type === 'image' ? "inline-block max-w-[80px] max-h-[80px] rounded" : "inline-block w-3/4"}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => submitExam(false)} // Call the memoized submitExam
        className="w-full px-4 py-3 mt-6 font-medium text-white transition duration-150 ease-in-out bg-indigo-600 rounded-md hover:bg-indigo-700"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Exam'}
      </button>
    </div>
  );

  const renderExamSubmitted = () => (
    <div className="max-w-xl p-6 mx-auto space-y-4 text-center bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Exam Completed!</h2>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {examResult && (
        <div className="space-y-2 text-gray-700">
          <p className="text-lg">Your Score: <span className="font-bold text-blue-700">{examResult.score} / {examResult.totalQuestions}</span></p>
          <p>Correct Answers: <span className="font-bold text-green-700">{examResult.correctAnswersCount}</span></p>
          <p>Time Taken: <span className="font-bold">{formatTime(examResult.timeTaken)}</span></p>
          {examResult.timeUp && <p className="font-semibold text-red-500">Time ran out!</p>}
        </div>
      )}
      <button
        onClick={viewAnswers}
        className="w-full px-4 py-2 mt-4 font-medium text-white transition duration-150 ease-in-out bg-purple-600 rounded-md hover:bg-purple-700"
        disabled={loading}
      >
        {loading ? 'Loading Review...' : 'View Answers'}
      </button>
      <button
        onClick={resetExamFlow}
        className="w-full px-4 py-2 mt-2 font-medium text-gray-800 transition duration-150 ease-in-out bg-gray-300 rounded-md hover:bg-gray-400"
      >
        Start New Exam
      </button>
    </div>
  );

  const renderViewAnswers = () => (
    <div className="max-w-3xl p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">
        Exam Review: {selectedExam.set} ({selectedExam.category} &gt; {selectedExam.section})
      </h2>
      {error && <p className="mb-4 text-center text-red-600">{error}</p>}

      {examDetailsForReview && examDetailsForReview.length > 0 ? (
        <div className="space-y-6">
          {examDetailsForReview.map((question, qIndex) => (
            <div key={question._id || qIndex} className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="mb-2 text-lg font-semibold">Q{qIndex + 1}: {question.questionText}</p>
              <MediaDisplay
                src={question.questionImage}
                type="image"
                alt="Question visual"
                className="h-auto max-w-full mb-2 rounded-md"
              />
              <MediaDisplay
                src={question.questionAudio}
                type="audio"
                className="w-full mb-2"
              />
              <ul className="pl-5 space-y-1 list-disc">
                {question.options.map((option, oIndex) => (
                  <li
                    key={oIndex}
                    className={`
                      ${String.fromCharCode(97 + oIndex) === question.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-800'}
                      ${String.fromCharCode(97 + oIndex) === question.userSelectedOption && String.fromCharCode(97 + oIndex) !== question.correctAnswer ? 'text-red-700 font-bold' : ''}
                    `}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + oIndex)}.</span>{' '}
                    {option.type === 'text' && <span>{option.content}</span>}
                    <MediaDisplay
                      src={option.content}
                      type={option.type}
                      alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                      className={option.type === 'image' ? "inline-block max-w-[100px] max-h-[100px] rounded" : "inline-block w-3/4"}
                    />
                    {String.fromCharCode(97 + oIndex) === question.correctAnswer && <span className="ml-2 text-xs">(Correct Answer)</span>}
                    {String.fromCharCode(97 + oIndex) === question.userSelectedOption && <span className={`ml-2 text-xs font-bold ${question.userSelectedOption === question.correctAnswer ? 'text-green-700' : 'text-red-700'}`}>(Your Answer)</span>}
                  </li>
                ))}
              </ul>
              {question.userSelectedOption === null && <p className="mt-2 text-sm text-yellow-600">You did not answer this question.</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No review data available.</p>
      )}

      <button
        onClick={resetExamFlow}
        className="w-full px-4 py-2 mt-6 font-medium text-gray-800 transition duration-150 ease-in-out bg-gray-300 rounded-md hover:bg-gray-400"
      >
        Start New Exam
      </button>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="flex items-center text-xl text-white">
            <svg className="w-8 h-8 mr-3 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {currentPhase === 'categorySelection' && renderCategorySelection()}
      {currentPhase === 'examInProgress' && renderExamInProgress()}
      {currentPhase === 'examSubmitted' && renderExamSubmitted()}
      {currentPhase === 'viewAnswers' && renderViewAnswers()}
    </div>
  );
}