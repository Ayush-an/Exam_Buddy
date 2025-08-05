// SignIn.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/admin/signin`, form);
      const admin = res.data.admin;
      localStorage.setItem('admin', JSON.stringify(admin));
      
      if (admin.role === 'question-paper-setter') {
        alert('Logged in as Question Paper Setter!');
        navigate('/question');
      } else if (admin.role === 'moderator') {
        alert('Logged in as Moderator!');
        navigate('/paper-set');
      } else {

        alert('Login successful, but role not recognized for specific navigation.');
        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      alert(`Login failed: ${err.response?.data?.message || 'Please check your credentials.'}`);
    }
  };

  const handleSignUpClick = () => {
    navigate('/admin-signup');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Sign In</h2>
        
        {/* Username Input - Corrected to 'username' */}
        <div>
          <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">Username</label>
          <input
            id="username"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        
        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        
        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full px-4 py-3 font-semibold text-white transition duration-150 ease-in-out bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign In
        </button>

        {/* Link to Sign Up Page */}
        <p className="text-sm text-center text-gray-600">
          Don't have an account? {' '}
          <button
            type="button"
            onClick={handleSignUpClick}
            className="font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}