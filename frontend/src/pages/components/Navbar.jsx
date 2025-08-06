// components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCogs, FaHome, FaLifeRing, FaStar } from 'react-icons/fa';
import logo from '../assets/exam-buddy-logo.PNG';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo (Image + Name) */}
          <div className="flex items-center space-x-3">
            <img
              src={logo}
              alt="Logo"
              className="w-auto h-10"
            />
            <span className="text-xl font-bold tracking-widest text-gray-800 dark:text-white">
              ExamPortal
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden space-x-8 md:flex">
            <Link to="/exam" className="font-medium text-gray-700 transition duration-300 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <div className="flex items-center gap-1"><FaHome /> Home</div>
            </Link>
            <Link to="/settings" className="font-medium text-gray-700 transition duration-300 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <div className="flex items-center gap-1"><FaCogs /> Settings</div>
            </Link>
            <Link to="/support" className="font-medium text-gray-700 transition duration-300 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <div className="flex items-center gap-1"><FaLifeRing /> Support</div>
            </Link>
            <Link to="/subscription" className="font-medium text-gray-700 transition duration-300 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <div className="flex items-center gap-1"><FaStar /> Subscription</div>
            </Link>
          </div>

          {/* Mobile Menu Placeholder */}
          <div className="md:hidden">
            {/* Hamburger menu (optional) */}
          </div>
        </div>
      </div>
    </nav>
  );
}
