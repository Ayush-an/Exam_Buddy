import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserSignIn from './UserSignIn';
import UserSignUp from './UserSignUp';
import { FaUserAstronaut, FaUserPlus } from 'react-icons/fa';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-white bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 md:flex-row">
      
      {/* Left Panel */}
      <div className="z-10 flex flex-col items-center justify-center w-full px-6 py-12 text-center md:w-1/2 md:py-20 md:px-12">
        <FaUserAstronaut className="mb-6 text-5xl text-white drop-shadow-xl" />
        <h1 className="mb-4 text-4xl font-extrabold tracking-wider text-white md:text-5xl drop-shadow-md">
          🚀 Exam Portal
        </h1>
        <p className="max-w-md mb-8 text-lg text-center text-gray-300">
          Sign in to access your dashboard or create a new account to begin your journey.
        </p>

        {/* Toggle Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setIsSignIn(true)}
            className={`px-6 py-3 rounded-full text-md font-semibold transition duration-300 ease-in-out flex items-center gap-2 ${
              isSignIn
                ? 'bg-white text-indigo-900 shadow-xl'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
            }`}
          >
            <FaUserAstronaut />
            Sign In
          </button>
          <button
            onClick={() => setIsSignIn(false)}
            className={`px-6 py-3 rounded-full text-md font-semibold transition duration-300 ease-in-out flex items-center gap-2 ${
              !isSignIn
                ? 'bg-white text-indigo-900 shadow-xl'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
            }`}
          >
            <FaUserPlus />
            Sign Up
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="z-10 flex items-center justify-center w-full px-4 py-12 md:w-1/2 md:px-10">
        <div className="relative w-full max-w-xl mx-auto overflow-hidden text-gray-800 bg-white shadow-2xl rounded-2xl dark:bg-gray-900 dark:text-white">
          <AnimatePresence mode="wait">
            {isSignIn ? (
              <motion.div
                key="signin"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-10"
              >
                <UserSignIn />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-10"
              >
                <UserSignUp />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute bg-purple-500 rounded-full -top-20 -left-20 w-96 h-96 opacity-30 filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-72 h-72 opacity-30 filter blur-2xl animate-ping"></div>
    </div>
  );
}
