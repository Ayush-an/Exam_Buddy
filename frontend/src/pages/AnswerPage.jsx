import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserCircle, FaTasks, FaCube, FaCog, FaLifeRing, FaPowerOff,
    FaChevronDown, FaChevronUp, FaBars, FaTimes, FaToggleOn, FaToggleOff, FaChartLine
} from 'react-icons/fa'; import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; import animationData from './assets/Animation1.json';
import examLogo from './assets/exam-buddy-logo.PNG'; import welcomeBannerImage from './assets/Backround.png';
import BeginnerImage from './assets/first.png'; import IntermediateImage from './assets/second.png';
import AdvancedImage from './assets/third.png'; import ProAdvancedImage from './assets/fourth.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

//const SERVER_BASE_URL = process.env.REACT_APP_API_URL;
const API = axios.create({ baseURL: `${API_BASE_URL}/api`, });
export default function AnswerPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isUserPaid, setIsUserPaid] = useState(false);
    const [currentPhase, setCurrentPhase] = useState('dashboard');
    const [allExamData, setAllExamData] = useState([]);
    const [selectedExam, setSelectedExam] = useState({
        category: '', section: '', set: '', timeLimitMinutes: 0,
    });
    const [availableSets, setAvailableSets] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    //const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const timerIntervalRef = useRef(null);
    const [examResult, setExamResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Beginner');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isExaminationDropdownOpen, setIsExaminationDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    // Effect to check user authentication and fetch initial data
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            toast.error('Please sign in to access the exam page.');
            navigate('/user-signin');
            return;
        }
        setUser(storedUser);
        const now = new Date(); const hasActivePaidSubscription = storedUser.subscriptions?.some(sub => sub.status === 'active' &&
            new Date(sub.startDate) <= now && new Date(sub.endDate) >= now && sub.planName !== 'Free'); setIsUserPaid(hasActivePaidSubscription); const storedDarkMode = localStorage.getItem('darkMode');
        if (storedDarkMode !== null) { setDarkMode(JSON.parse(storedDarkMode)); } fetchAllExamData(); if (storedUser._id) { fetchProfileImage(storedUser._id); }
    }, [navigate]);
    // Effect to handle dark mode
    useEffect(() => {
        if (darkMode) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);
    // Check if a section is accessible for free users
    const isSectionAccessibleForFreeUser = useCallback((categoryName, sectionName) => {
        return categoryName === 'Beginner' || ['General Knowledge', 'Quantitative Aptitude', 'Reasoning', 'English Comprehension'].includes(sectionName);
    }, []);
    // Fetch all exam data
    const fetchAllExamData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.get('/question-papers');
            setAllExamData(res.data);
            if (res.data.length > 0) {
                const beginnerCategory = res.data.find(cat => cat.category === 'Beginner');
                setActiveTab(beginnerCategory ? 'Beginner' : res.data[0].category);
            }
        } catch (err) {
            console.error('Error fetching exam data:', err);
            setError('Failed to load exam data. Please try again.');
            toast.error('Failed to load exam data.');
        } finally {
            setLoading(false);
        }
    };
    // --- UPDATED: Fetch user's profile image ---
    const fetchProfileImage = async (userId) => {
        try {
            const res = await API.get(`/user/users/${userId}/profile-image`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.status && res.data.profileImage) {
                setProfileImage(`${API_BASE_URL}${res.data.profileImage}`);
            }
        } catch (err) {
            console.error('Could not fetch profile image:', err);
        }
    };
    const handleCategoryTabChange = (category) => {
        setActiveTab(category);
        setSelectedExam(prev => ({ ...prev, category, section: '', set: '', timeLimitMinutes: 0 }));
        setAvailableSets([]);
    };
    const handleSectionCardClick = (category, sectionName) => {
        const currentCategoryData = allExamData.find(cat => cat.category === category);
        const currentSectionData = currentCategoryData?.sections.find(sec => sec.name === sectionName);
        if (!currentSectionData) { toast.error('Selected section data not found.'); return; }
        if (!isUserPaid && !isSectionAccessibleForFreeUser(category, sectionName)) {
            toast.error('This section is for Paid subscribers. Please upgrade.');
            return;
        }
        if (currentSectionData.sets && currentSectionData.sets.length > 0) {
            setSelectedExam(prev => ({ ...prev, category, section: sectionName, set: '', timeLimitMinutes: 0 }));
            setAvailableSets(currentSectionData.sets);
            setCurrentPhase('selectSet');
        } else { toast.warn('No sets found for this section.'); }
    };
    const handleSetSelection = (setObject) => {
        setSelectedExam(prev => ({ ...prev, set: setObject.name, timeLimitMinutes: setObject.timeLimitMinutes || 0 }));
        setCurrentPhase('confirmExamStart');
    };
    const calculateTimeTaken = useCallback(() => {
        if (!startTime) return 0;
        const endTime = new Date();
        return Math.floor((endTime - startTime) / 1000);
    }, [startTime]);
    const submitExam = useCallback(async (timeUp = false) => {
        clearInterval(timerIntervalRef.current);
        setLoading(true);
        setError(null);
        let currentScore = 0;
        let currentCorrectAnswersCount = 0;
        let totalMarksPossible = 0;
        const totalQuestions = questions.length;
        const calculatedDuration = calculateTimeTaken();
        const answersForSubmission = questions.map(q => {
            const selected = userAnswers[q._id];
            const isCorrect = selected === q.correctAnswer;
            if (isCorrect) { currentScore += q.marks; currentCorrectAnswersCount++; }
            totalMarksPossible += q.marks;
            return { questionId: q._id, selectedOption: selected, isCorrect };
        });
        // setCorrectAnswersCount(currentCorrectAnswersCount);
        const examAttemptData = {
            userId: user?._id, category: selectedExam.category, section: selectedExam.section,
            set: selectedExam.set, score: currentScore, totalMarksPossible: totalMarksPossible, totalQuestions: totalQuestions,
            correctAnswers: currentCorrectAnswersCount, duration: calculatedDuration, answers: answersForSubmission,
        };
        try {
            const response = await API.post('/user/submit-exam-results', examAttemptData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setExamResult({
                score: response.data.examResult.score, totalMarksPossible: response.data.examResult.totalMarksPossible,
                totalQuestions: response.data.examResult.totalQuestions, correctAnswersCount: response.data.examResult.correctAnswers,
                timeTaken: response.data.examResult.duration, timeUp, examAttemptId: response.data.examResult.mongoId
            });
            setCurrentPhase('examSubmitted');
            toast.success('Exam submitted successfully!' + (timeUp ? ' Time ran out.' : ''));
            // Show sidebar after exam submission
            setIsSidebarOpen(true);
        } catch (err) {
            console.error('Error submitting exam:', err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message;
            setError(`Failed to submit exam: ${errorMessage}`);
            toast.error(`Failed to submit exam: ${errorMessage}`);
            setCurrentPhase('examSubmitted');
            // Show sidebar even if there's an error in submission
            setIsSidebarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [user, selectedExam, questions, userAnswers, calculateTimeTaken]);
    useEffect(() => {
        if (currentPhase === 'examInProgress' && timeLeft > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerIntervalRef.current); submitExam(true); return 0;
                    } return prevTime - 1;
                });
            }, 1000);
        } else { clearInterval(timerIntervalRef.current); } return () => clearInterval(timerIntervalRef.current);
    }, [currentPhase, timeLeft, submitExam]);
    const startExam = async () => {
        const { category, section, set } = selectedExam;
        if (!category || !section || !set) { toast.warn('Please select a Category, Section, and Set to start the exam.'); return; }
        if (!isUserPaid && !isSectionAccessibleForFreeUser(category, section)) { toast.error('This section is for Paid subscribers. Please upgrade.'); return; }
        setLoading(true); setError(null); try {
            const questionsRes = await API.get(`/questions/${category}/${section}/${set}`);
            setQuestions(questionsRes.data);
            setTimeLeft(selectedExam.timeLimitMinutes * 60);
            setStartTime(new Date());
            const initialUserAnswers = {};
            questionsRes.data.forEach(q => { initialUserAnswers[q._id] = null; });
            setUserAnswers(initialUserAnswers);
            setCurrentPhase('examInProgress');
            // Hide sidebar when exam starts
            setIsSidebarOpen(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(`Failed to load exam questions: ${errorMessage}`);
            toast.error(`Failed to load exam: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }; const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const handleOptionSelect = (questionId, optionLetter) => { setUserAnswers(prevAnswers => ({ ...prevAnswers, [questionId]: optionLetter })); };
    const resetExamFlow = () => {
        setCurrentPhase('dashboard');
        setQuestions([]);
        setUserAnswers({});
        setExamResult(null);
        setError(null);
        setSelectedExam({ category: '', section: '', set: '', timeLimitMinutes: 0 });
        setAvailableSets([]);
        clearInterval(timerIntervalRef.current);
        setTimeLeft(0);
        setStartTime(null); //setCorrectAnswersCount(0);
        // Ensure sidebar is open when resetting flow to dashboard
        setIsSidebarOpen(true);
    }; // --- UPDATED: MediaDisplay Component to use Server Base URL ---
    const MediaDisplay = ({ src, type, alt, className }) => {
        if (!src) return null;
        // If src is a relative path (starts with /), prepend server URL. Otherwise, use as is.
        const fullSrc = src.startsWith('http') ? src : `${API_BASE_URL}${src}`; const handleError = (e) => {
            e.target.onerror = null; e.target.style.display = 'none';
        };
        if (type === 'image') { return <img src={fullSrc} alt={alt} className={className} onError={handleError} />; }
        if (type === 'audio') {
            return (<audio controls src={fullSrc} className={className} onError={handleError}>Your browser does not support the audio element.</audio>);
        } return null;
    };
    const renderDashboard = () => (
        <div className="w-full"> <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Your Learning <span className="text-rose-500">Dashboard</span></h1>
            <div className="items-center hidden space-x-3 md:flex"><div className="text-right"> <p className="text-gray-700 dark:text-gray-900">{user?.firstName || 'Guest'}</p>
                <p className="text-sm text-gray-800 dark:text-gray-400">Student</p> </div>
                {/* The profileImage state now holds the full URL, so this works correctly */}
                {profileImage ? ( <img src={profileImage} alt="Profile" className="object-cover w-12 h-12 border-2 border-blue-500 rounded-full" />
                ) : ( <div className="flex items-center justify-center w-12 h-12 bg-blue-200 rounded-full dark:bg-blue-800">
                    <FaUserCircle className="text-3xl text-blue-800 dark:text-blue-200" /></div> )}</div></div>
            {/* ... rest of the component ... */}
            <div className="relative w-full h-56 max-w-full p-8 mb-8 overflow-hidden text-white shadow-lg rounded-xl"
                style={{ backgroundImage: `url(${welcomeBannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="relative z-10"> <p className="text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <h2 className="mt-2 text-3xl font-bold">Welcome back, {user?.firstName || 'Guest'}!</h2> <p className="mt-1 text-sm">Always stay updated in your student portal</p> </div> </div>
            {/* Category Tabs */}
            <div className="flex pb-4 my-8 space-x-4 overflow-x-auto scrollbar-hide"> {allExamData.map(category => {
                const categoryColorMap = {
                    Beginner: 'bg-pink-400', Intermediate: 'bg-pink-400', Advanced: 'bg-pink-400', 'Pro Advanced': 'bg-purple-600',
                };
                const activeColor = categoryColorMap[category.category] || 'bg-indigo-600';
                return (
                    <motion.button key={category.category} onClick={() => handleCategoryTabChange(category.category)} initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className={`px-6 py-2 rounded-full font-medium text-base transition-colors duration-200 flex-shrink-0 ${
                            activeTab === category.category ? `${activeColor} text-white shadow-md`
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}>
                        {category.category} </motion.button>);
            })}</div>
            <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">{activeTab} Study Sections</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"> {allExamData.find(cat => cat.category === activeTab)?.sections.map(section => {
                const isDisabled = !isUserPaid && !isSectionAccessibleForFreeUser(activeTab, section.name);
                const name = section.name.toLowerCase(); let sectionImage = IntermediateImage; let bgColorClass = 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700';
                if (name.includes('beginner')) {
                    sectionImage = BeginnerImage; bgColorClass = 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800';
                } else if (name.includes('intermediate')) {
                    sectionImage = IntermediateImage; bgColorClass = 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800';
                } else if (name.includes('advanced') && !name.includes('pro')) {
                    sectionImage = AdvancedImage; bgColorClass = 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800';
                } else if (name.includes('pro advanced')) {
                    sectionImage = ProAdvancedImage; bgColorClass = 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800';
                }
                const cardClass = isDisabled ? `border-gray-300 text-gray-500 cursor-not-allowed opacity-70 ${bgColorClass}` : `border-gray-200 cursor-pointer ${bgColorClass}`;
                return ( <motion.div key={section.name}
                    className={`p-6 border rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${cardClass}`}
                    onClick={() => !isDisabled && handleSectionCardClick(activeTab, section.name)} whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.97 } : {}} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}  >
                    <img src={sectionImage} alt={section.name} className="object-contain w-24 h-24 mb-4 drop-shadow-md" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white"> {section.name} </h3> {isDisabled && <p className="mt-1 text-sm text-red-500">(Paid Access)</p>}</motion.div>);
            })} </div>
            {error && <p className="mt-8 text-center text-red-600">{error}</p>}</div>);
    const renderSelectSet = () => (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }}
            className="w-full max-w-2xl p-8 mx-auto space-y-6 shadow-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
            <div className="text-center"> <h2 className="text-3xl font-extrabold text-indigo-800 dark:text-indigo-200"> Choose Your Exam Set</h2>
                <p className="mt-2 text-lg text-gray-700 dark:text-gray-300"> Category: <span className="font-semibold text-indigo-600">{selectedExam.category}</span></p>
                <p className="text-lg text-gray-700 dark:text-gray-300">Section: <span className="font-semibold text-indigo-600">{selectedExam.section}</span> </p></div>
            {availableSets.length > 0 ? ( <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {availableSets.map((set) => ( <motion.button key={set.name} onClick={() => handleSetSelection(set)}
                    whileHover={{ scale: 1.03, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)" }} whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center p-4 text-center transition-all duration-200 bg-white border border-blue-300 shadow-sm cursor-pointer rounded-xl hover:bg-blue-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600">
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-100">{set.name}</h3> <p className="text-sm text-blue-600 dark:text-blue-300">{set.timeLimitMinutes} minutes</p>
                </motion.button>))}</div> ) : (<p className="text-center text-gray-600 dark:text-gray-400">No sets available for this section.</p> )}
            <button onClick={resetExamFlow} className="w-full px-6 py-3 mt-6 font-semibold text-white transition duration-200 rounded-lg bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 dark:from-gray-700 dark:to-gray-900">
                Go Back to Dashboard </button> </motion.div> );
    const renderConfirmExamStart = () => (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }}
            className="w-full max-w-xl p-8 space-y-6 text-center bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Confirm Exam Details</h2> <p className="text-lg text-gray-700 dark:text-gray-300">You are about to start the exam for:</p>
            <p className="text-xl font-semibold text-indigo-600">{selectedExam.category} &gt; {selectedExam.section} &gt; {selectedExam.set}</p>
            <p className="text-gray-600 text-md dark:text-gray-400">Time Limit: <span className="font-bold">{selectedExam.timeLimitMinutes} minutes</span></p>
            <button onClick={startExam}
                className="w-full px-6 py-3 font-medium text-white transition-colors duration-200 bg-green-600 rounded-md hover:bg-green-700"
                disabled={loading} > {loading ? 'Starting...' : 'Start Exam Now'}</button>
            <button onClick={() => setCurrentPhase('selectSet')}
                className="w-full px-6 py-3 mt-4 font-medium text-gray-800 transition-colors duration-200 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Go Back</button></motion.div>);
    const renderExamInProgress = () => (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }}
            className="w-full max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-gray-100">
            <h2 className="mb-4 text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Exam: {selectedExam.set} ({selectedExam.category} &gt; {selectedExam.section})</h2>
            <div className="mb-6 font-mono text-lg text-right text-gray-700 dark:text-gray-300"> Time Left: <span className="font-bold text-red-600">{formatTime(timeLeft)}</span> </div>
            {error && <p className="text-center text-red-600">{error}</p>} <div className="space-y-6">
                {questions.map((question, qIndex) => ( <motion.div key={question._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: qIndex * 0.05 }}
                    className="p-4 border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <p className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Q{qIndex + 1}: {question.questionText}</p>
                    {question.marks && <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Marks: {question.marks}</p>}
                    <MediaDisplay src={question.questionImage} type="image" alt="Question visual" className="h-auto max-w-full mb-2 rounded-md" />
                    <MediaDisplay src={question.questionAudio} type="audio" className="w-full mb-2" /> <div className="space-y-2">
                        {question.options.map((option, oIndex) => {
                            const optionChar = String.fromCharCode(97 + oIndex);
                            return ( <label key={oIndex} className="flex items-center p-3 space-x-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                <input type="radio" name={`question-${question._id}`} value={optionChar} checked={userAnswers[question._id] === optionChar}
                                    onChange={() => handleOptionSelect(question._id, optionChar)} className="w-5 h-5 text-blue-600 form-radio focus:ring-blue-500" />
                                <span className="font-bold text-gray-800 dark:text-gray-100">{String.fromCharCode(65 + oIndex)}.</span>
                                {option.type === 'text' ? ( <span className="text-gray-700 dark:text-gray-200">{option.content}</span>
                                ) : ( <MediaDisplay src={option.content} type={option.type} alt={`Option ${String.fromCharCode(65 + oIndex)}`} className="inline-block max-w-xs rounded max-h-24" />
                                )} </label> );
                        })}</div> </motion.div> ))} </div>
            <button onClick={() => submitExam(false)} className="w-full px-4 py-3 mt-8 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Exam'} </button> </motion.div> );
    const renderExamSubmitted = () => (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3 }}
            className="w-full max-w-xl p-8 space-y-6 text-center bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:text-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Exam Completed!</h2> {error && <p className="mb-4 text-red-600">{error}</p>}
            {examResult && ( <div className="space-y-3 text-lg text-gray-700 dark:text-gray-300"> <p>Your Score: <span className="font-bold text-blue-700">{examResult.score} / {examResult.totalMarksPossible}</span></p>
                <p>Correct Answers: <span className="font-bold text-green-700">{examResult.correctAnswersCount}</span></p>
                <p>Total Questions: <span className="font-bold">{examResult.totalQuestions}</span></p> <p>Time Taken: <span className="font-bold">{formatTime(examResult.timeTaken)}</span></p>
                {examResult.timeUp && <p className="font-semibold text-red-500">Time ran out!</p>} {examResult.examAttemptId ? (<Link to={`/view-answer/${user?._id}/${examResult.examAttemptId}`}>
                    <button className="w-full px-4 py-2 mt-4 font-medium text-white transition duration-150 ease-in-out bg-purple-600 rounded-md hover:bg-purple-700">
                        View Answers </button> </Link> ) : ( <p className="text-sm text-red-500">Attempt ID missing, cannot view answers.</p>)} </div> )}
            <button onClick={resetExamFlow} className="w-full px-4 py-3 mt-4 font-medium text-gray-800 bg-gray-300 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Start New Exam </button> </motion.div>);
    const handleLogout = () => { localStorage.removeItem('user'); localStorage.removeItem('token'); navigate('/auth'); toast.info('You have been logged out.'); };
    const toggleDarkMode = () => setDarkMode(prevMode => !prevMode);
    return (
        <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>  {/* ... rest of the main return statement (loading overlay, sidebar, main content) ... */}
            {loading && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50"> <div className="flex items-center text-xl text-white">
                <svg className="w-8 h-8 mr-3 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>Loading...</div></div>  )}
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme={darkMode ? "dark" : "light"} />
            <button className="fixed z-50 p-2 bg-white rounded-full shadow-lg top-4 left-4 dark:bg-gray-700 md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <FaTimes className="text-gray-700 dark:text-gray-100" /> : <FaBars className="text-gray-700 dark:text-gray-100" />}  </button>
            <AnimatePresence>
                {/* Modified condition for sidebar visibility */}
                {(isSidebarOpen && currentPhase !== 'examInProgress') || (window.innerWidth >= 768 && currentPhase !== 'examInProgress') ? (
                    <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed inset-y-0 left-0 z-40 flex flex-col justify-between w-64 px-4 py-6 shadow-xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 dark:bg-gray-800 md:static md:translate-x-0 md:rounded-r-3xl">
                        <div> <div className="flex items-center mb-10 ml-2"> <img src={examLogo} alt="Exam Buddy Logo" className="w-10 h-10 mr-2" />
                            <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">EXAM.BUDDY</span> </div> <nav className="space-y-4">
                            <Link to="#" className={`flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200 ${currentPhase === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onClick={() => { setCurrentPhase('dashboard'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}><FaChartLine className="w-5 h-5 mr-3" /> Dashboard</Link>
                            <Link to="/profile" className="flex items-center p-3 font-medium text-gray-700 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
                                <FaUserCircle className="w-5 h-5 mr-3" />profile </Link><div className="relative">
                                <button className={`w-full flex items-center justify-between p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200`}
                                    onClick={() => setIsExaminationDropdownOpen(prev => !prev)}><div className="flex items-center">
                                        <FaTasks className="w-5 h-5 mr-3" /> Examination  </div>{isExaminationDropdownOpen ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}</button>
                                <AnimatePresence> {isExaminationDropdownOpen && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-2 ml-8 space-y-2 overflow-hidden">
                                        <Link to="#" className="block p-2 text-gray-600 transition-colors duration-200 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>Practice Exams</Link>
                                        <Link to="#" className="block p-2 text-gray-600 transition-colors duration-200 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>Past Papers</Link>
                                    </motion.div> )} </AnimatePresence> </div>
                            <Link to="/subscription" className="flex items-center p-3 font-medium text-gray-700 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
                                <FaCube className="w-5 h-5 mr-3" /> Subscription  </Link>
                            <Link to="/settings" className="flex items-center p-3 font-medium text-gray-700 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
                                <FaCog className="w-5 h-5 mr-3" /> Settings </Link>
                            <Link to="/support" className="flex items-center p-3 font-medium text-gray-700 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
                                <FaLifeRing className="w-5 h-5 mr-3" /> Support </Link>  </nav> </div> <div className="flex items-center justify-center h-40">
                            <Lottie animationData={animationData} loop={true} autoplay={true} style={{ width: '100%', maxWidth: '180px', height: 'auto' }} /> </div>
                        <div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
                            
                            <button onClick={handleLogout} className="flex items-center justify-center w-full p-3 text-red-600 transition-colors duration-200 border border-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-300">
                                <FaPowerOff className="w-5 h-5 mr-2" /> Logout </button>
                            
                            <button onClick={toggleDarkMode} className="flex items-center justify-center w-full p-3 mt-2 text-gray-700 transition-colors duration-200 border border-gray-300 rounded-full hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                                {darkMode ? <FaToggleOn className="w-5 h-5 mr-2" /> : <FaToggleOff className="w-5 h-5 mr-2" />}  {darkMode ? 'Light Mode' : 'Dark Mode'}</button> </div></motion.div>
                ) : null}
            </AnimatePresence>
            <main className="flex-1 p-4 bg-gradient-to-br from-slate-100 to-slate-300 dark:from-gray-900 dark:to-gray-800 md:p-10">
                <section className={`flex items-center justify-center w-full min-h-full p-6 md:p-12 overflow-hidden
bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 rounded-3xl shadow-2xl dark:bg-gray-800 dark:bg-opacity-80 dark:border-gray-700 backdrop-blur-lg`}>
                    <AnimatePresence mode="wait">  <motion.div key={currentPhase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}  transition={{ duration: 0.3 }} className="w-full" >
                        {currentPhase === 'dashboard' && renderDashboard()} {currentPhase === 'selectSet' && renderSelectSet()} {currentPhase === 'confirmExamStart' && renderConfirmExamStart()}
                        {currentPhase === 'examInProgress' && renderExamInProgress()} {currentPhase === 'examSubmitted' && renderExamSubmitted()}  </motion.div>
                    </AnimatePresence>  </section> </main></div>);
}