import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const MediaDisplay = ({ src, type, alt, className }) => {
    if (!src) return null;
    const fullSrc = `http://localhost:3000/${src}`;
    const handleError = (e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
    };

    if (type === 'image') {
        return <img src={fullSrc} alt={alt} className={className} onError={handleError} />;
    }
    if (type === 'audio') {
        return (
            <audio controls className={className} onError={handleError}>
                <source src={fullSrc} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>
        );
    }
    return null;
};

export default function ViewAnswer() {
    const { userId, examAttemptId } = useParams();
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttemptReview = async () => {
            if (!userId || userId === 'undefined' || !examAttemptId || examAttemptId === 'undefined') {
                setError("User ID or Attempt ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:3000/api/user/exam-review/${userId}/${examAttemptId}`);
                if (res.data?.status && res.data.review) {
                    setReviewData(res.data.review);
                } else {
                    throw new Error("Review data not found.");
                }
            } catch (err) {
                console.error("Error fetching exam review:", err);
                setError(err.response?.data?.message || "Failed to load the exam review.");
            } finally {
                setLoading(false);
            }
        };
        fetchAttemptReview();
    }, [userId, examAttemptId]);

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl font-semibold">Loading Review...</div></div>;
    if (error) return (
        <div className="max-w-4xl p-4 mx-auto text-center text-red-500">
            <h2 className="text-2xl font-bold">Error</h2>
            <p className="mt-2">{error}</p>
            <Link to="/answer" className="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Go to Exam Page
            </Link>
        </div>
    );
    if (!reviewData || !reviewData.answers) {
        return <div className="mt-4 text-center text-gray-500">Attempt review not found.</div>;
    }

    const { category, section, set, answers } = reviewData;

    return (
        <div className="max-w-3xl p-6 mx-auto my-8 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">
                Exam Review: {set}
            </h2>
            <h3 className="mb-6 text-lg font-medium text-center text-gray-600">
                {category} &gt; {section}
            </h3>

            <div className="space-y-6">
                {answers.map((answer, qIndex) => {
                    const question = answer.questionId;
                    return (
                        <div key={question?._id || qIndex} className="p-4 border border-gray-200 rounded-md bg-gray-50">
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
                            <ul className="pl-5 mt-4 space-y-2 list-none">
                                {question.options.map((option, oIndex) => {
                                    const optionLetter = String.fromCharCode(97 + oIndex);
                                    const isCorrectAnswer = optionLetter === question.correctAnswer;
                                    const isUserAnswer = optionLetter === answer.selectedOption;

                                    let liClassName = 'p-3 rounded-lg border-2';
                                    if (isCorrectAnswer) {
                                        liClassName += ' bg-green-100 border-green-500';
                                    } else if (isUserAnswer) {
                                        liClassName += ' bg-red-100 border-red-500';
                                    } else {
                                        liClassName += ' bg-white border-gray-300';
                                    }

                                    return (
                                        <li key={oIndex} className={liClassName}>
                                            <div className="flex items-center">
                                                <span className="font-bold">{String.fromCharCode(65 + oIndex)}.</span>
                                                <div className="ml-3">
                                                    {option.type === 'text' && <span>{option.content}</span>}
                                                    <MediaDisplay
                                                        src={option.content}
                                                        type={option.type}
                                                        alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                        className={option.type === 'image' ? "inline-block max-w-[100px] max-h-[100px] rounded" : "inline-block w-full"}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm font-semibold">
                                                {isCorrectAnswer && <span className="text-green-700">(Correct Answer)</span>}
                                                {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-red-700">(Your Answer)</span>}
                                                {isUserAnswer && isCorrectAnswer && <span className="ml-2 text-green-700">(Your Answer)</span>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {answer.selectedOption === null && (
                                <p className="p-2 mt-4 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded-md">
                                    You did not answer this question.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <Link to="/exam" className="w-full px-6 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    Start a New Exam
                </Link>
            </div>
        </div>
    );
}
