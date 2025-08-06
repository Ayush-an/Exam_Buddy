import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUserShield } from 'react-icons/fa';
import logo from './assets/exam-buddy-logo.PNG';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-300 via-cyan-200 to-indigo-200 bg-animate">
      <style>
        {`
          .bg-animate {
            background-size: 400% 400%;
            animation: gradientBG 5s ease infinite;
          }

          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div className="w-full max-w-md p-10 text-center bg-white shadow-2xl rounded-3xl">
        <img
          src={logo}
          alt="Exam Buddy Logo"
          className="h-auto mx-auto mb-6 w-28 drop-shadow-md animate-fade-in"
        />

        <h1 className="mb-4 text-3xl font-bold text-indigo-700">Welcome to Exam Portal</h1>
        <p className="mb-8 text-gray-600">Please choose your login type</p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/user-signin')}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition-transform bg-indigo-600 shadow-md rounded-xl hover:bg-indigo-700 hover:scale-105"
          >
            <FaUserGraduate className="text-lg" /> User Login
          </button>

          <button
            onClick={() => navigate('/admin-signin')}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition-transform bg-blue-600 shadow-md rounded-xl hover:bg-blue-700 hover:scale-105"
          >
            <FaUserShield className="text-lg" /> Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
