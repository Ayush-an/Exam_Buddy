import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerIntervalRef = useRef(null);

  // Post-exam states
  const [examResult, setExamResult] = useState(null);

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
  }, []);

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
  }, [startTime]);

  const submitExam = useCallback(async (timeUp = false) => {
    clearInterval(timerIntervalRef.current);
    setLoading(true);
    setError(null);

    let currentScore = 0;
    let currentCorrectAnswersCount = 0;
    let totalMarksPossible = 0; // Initialize total possible marks

    const totalQuestions = questions.length;

    // Calculate duration only if exam started
    const calculatedDuration = calculateTimeTaken();

    const answersForSubmission = questions.map(q => {
      const selected = userAnswers[q._id];
      const isCorrect = selected === q.correctAnswer;

      // Add marks for correct answers
      if (isCorrect) {
        currentScore += q.marks; // Add question's marks to score
        currentCorrectAnswersCount += 1;
      }
      totalMarksPossible += q.marks; // Add question's marks to total possible marks

      return { questionId: q._id, selectedOption: selected, isCorrect };
    });

    setCorrectAnswersCount(currentCorrectAnswersCount);

    const examAttemptData = {
      userId: user?._id,
      category: selectedExam.category,
      section: selectedExam.section,
      set: selectedExam.set,
      score: currentScore, // This is the calculated score based on marks
      totalMarksPossible: totalMarksPossible, // Send total possible marks
      totalQuestions: totalQuestions,
      correctAnswers: currentCorrectAnswersCount,
      duration: calculatedDuration,
      answers: answersForSubmission,
    };

    try {
      const response = await API.post('/user/exam-history', examAttemptData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update examResult state with data from backend response
      setExamResult({
        score: response.data.examResult.score,
        totalMarksPossible: response.data.examResult.totalMarksPossible, // Get totalMarksPossible from response
        totalQuestions: response.data.examResult.totalQuestions,
        correctAnswersCount: response.data.examResult.correctAnswers,
        timeTaken: response.data.examResult.duration,
        timeUp,
        examAttemptId: response.data.examResult.mongoId
      });

      setCurrentPhase('examSubmitted');
      toast.success('Exam submitted successfully!' + (timeUp ? ' Time ran out.' : ''));

    } catch (err) {
      console.error('Error submitting exam:', err.response ? err.response.data : err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to submit exam: ${errorMessage}`);
      toast.error(`Failed to submit exam: ${errorMessage}`);
      setCurrentPhase('examSubmitted'); // Still move to submitted phase to show error
    } finally {
      setLoading(false);
    }
  }, [user, selectedExam, questions, userAnswers, calculateTimeTaken]); // Added questions to dependencies

  // Timer lifecycle management
  useEffect(() => {
    if (currentPhase === 'examInProgress' && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerIntervalRef.current);
            submitExam(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [currentPhase, timeLeft, submitExam]);

  const startExam = async () => {
    const { category, section, set } = selectedExam;
    if (!category || !section || !set) {
      toast.warn('Please select a Category, Section, and Set to start the exam.');
      return;
    }
    if (!isUserPaid && !isSectionAccessibleForFreeUser(category, section)) {
        toast.error('This section is only for Paid subscribers. Please upgrade.');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const questionsRes = await API.get(`/questions/${category}/${section}/${set}`);
      setQuestions(questionsRes.data);
      setTimeLeft(selectedExam.timeLimitMinutes * 60);
      setStartTime(new Date());
      const initialUserAnswers = {};
      questionsRes.data.forEach(q => { initialUserAnswers[q._id] = null; });
      setUserAnswers(initialUserAnswers);
      setCurrentPhase('examInProgress');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to load exam questions: ${errorMessage}`);
      toast.error(`Failed to load exam: ${errorMessage}`);
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

  const resetExamFlow = () => {
    setCurrentPhase('categorySelection');
    setQuestions([]);
    setUserAnswers({});
    setExamResult(null);
    setError(null);
    setSelectedExam({ category: '', section: '', set: '', timeLimitMinutes: 0 });
    clearInterval(timerIntervalRef.current);
    setTimeLeft(0);
    setStartTime(null);
    setCorrectAnswersCount(0);
  };

  const MediaDisplay = ({ src, type, alt, className }) => {
    if (!src) return null;
    const fullSrc = `http://localhost:3000/${src}`;
    const handleError = (e) => { e.target.onerror = null; e.target.style.display = 'none'; };
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

  // --- RENDER FUNCTIONS ---

  const renderCategorySelection = () => (
    <div className="max-w-xl p-6 mx-auto space-y-4 bg-white rounded-lg shadow-md">
       <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">Select Exam Paper</h2>
       {user && (
         <p className="text-sm text-center text-gray-600">
            Welcome, <span className="font-semibold">{user.firstName}</span>! Status: <strong className={isUserPaid ? 'text-green-600' : 'text-red-600'}>
              {isUserPaid ? 'Paid' : 'Free'}
            </strong>
            {isUserPaid && user.subscriptions?.length > 0 && ` (${user.subscriptions.find(sub => sub.status === 'active')?.planName || 'Active'})`}
          </p>
        )}
        {error && <p className="text-center text-red-600">{error}</p>}
        <div>
          <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">Category</label>
          <select id="category" value={selectedExam.category} onChange={handleCategoryChange} className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" disabled={loading}>
            <option value="">-- Select --</option>
            {allExamData.map(cat => <option key={cat.category} value={cat.category}>{cat.category}</option>)}
          </select>
        </div>
        {selectedExam.category && (
          <div>
            <label htmlFor="section" className="block mb-1 text-sm font-medium text-gray-700">Section</label>
            <select id="section" value={selectedExam.section} onChange={handleSectionChange} className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" disabled={!selectedExam.category}>
              <option value="">-- Select --</option>
              {(allExamData.find(c => c.category === selectedExam.category)?.sections || []).map(sec => {
                const isDisabled = !isUserPaid && !isSectionAccessibleForFreeUser(selectedExam.category, sec.name);
                return <option key={sec.name} value={sec.name} disabled={isDisabled}>{sec.name}{isDisabled ? ' (Paid)' : ''}</option>
              })}
            </select>
          </div>
        )}
        {selectedExam.section && (
            <div>
             <label htmlFor="set" className="block mb-1 text-sm font-medium text-gray-700">Set</label>
             <select id="set" value={selectedExam.set} onChange={handleSetChange} className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" disabled={!selectedExam.section}>
                 <option value="">-- Select --</option>
                 {(allExamData.find(c => c.category === selectedExam.category)?.sections.find(s => s.name === selectedExam.section)?.sets || []).map(s => <option key={s.name} value={s.name}>{s.name} ({s.timeLimitMinutes} min)</option>)}
             </select>
            </div>
        )}
       <button onClick={startExam} className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700" disabled={loading || !selectedExam.set}>
          {loading ? 'Loading...' : 'Start Exam'}
       </button>
      </div>
  );

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
            {question.marks && <p className="text-sm text-gray-600">Marks: {question.marks}</p>} {/* Display Marks */}
            <MediaDisplay src={question.questionImage} type="image" alt="Question visual" className="h-auto max-w-full mb-2 rounded-md" />
            <MediaDisplay src={question.questionAudio} type="audio" className="w-full mb-2" />
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="flex items-center p-2 space-x-2 rounded-md cursor-pointer hover:bg-gray-100">
                  <input type="radio" name={`question-${question._id}`} value={String.fromCharCode(97 + oIndex)} checked={userAnswers[question._id] === String.fromCharCode(97 + oIndex)} onChange={() => handleOptionSelect(question._id, String.fromCharCode(97 + oIndex))} className="w-4 h-4 text-blue-600 form-radio" />
                  <span className="font-bold">{String.fromCharCode(65 + oIndex)}.</span>
                  {option.type === 'text' && <span>{option.content}</span>}
                  <MediaDisplay src={option.content} type={option.type} alt={`Option ${String.fromCharCode(65 + oIndex)}`} className={option.type === 'image' ? "inline-block max-w-[80px] max-h-[80px] rounded" : "inline-block w-3/4"} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => submitExam(false)} className="w-full px-4 py-3 mt-6 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700" disabled={loading}>
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
          {/* Display score out of total possible marks */}
          <p className="text-lg">Your Score: <span className="font-bold text-blue-700">{examResult.score} / {examResult.totalMarksPossible}</span></p>
          <p>Correct Answers: <span className="font-bold text-green-700">{examResult.correctAnswersCount}</span></p>
          <p>Total Questions: <span className="font-bold">{examResult.totalQuestions}</span></p>
          <p>Time Taken: <span className="font-bold">{formatTime(examResult.timeTaken)}</span></p>
          {examResult.timeUp && <p className="font-semibold text-red-500">Time ran out!</p>}

          {examResult.examAttemptId ? (
            <Link to={`/view-answer/${user?._id}/${examResult.examAttemptId}`}>
              <button className="w-full px-4 py-2 mt-4 font-medium text-white transition duration-150 ease-in-out bg-purple-600 rounded-md hover:bg-purple-700">
                View Answers
              </button>
            </Link>
          ) : (
            <p className="text-sm text-red-500">Attempt ID missing, cannot view answers.</p>
          )}
        </div>
      )}

      <button onClick={resetExamFlow} className="w-full px-4 py-2 mt-2 font-medium text-gray-800 bg-gray-300 rounded-md hover:bg-gray-400">
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
    </div>
  );
}
