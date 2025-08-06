// SignIn.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL;


export default function SignUp() {
  const [form, setForm] = useState({ username: '', password: '', role: 'question-paper-setter' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/admin/signup`, {
        username: form.username,
        password: form.password,
        role: form.role
      });
      alert('✅ Admin created successfully! Please sign in.');
      navigate('/signin');
    } catch (err) {
      console.error('Signup failed:', err.response ? err.response.data : err.message);
      alert(`Signup failed: ${err.response?.data?.error || 'Please try again.'}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Sign Up</h2>
        
        {/* Username Input - Corrected to 'username' */}
        <div>
          <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">Username</label>
          <input
            id="username"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Username"
            onChange={e => setForm({ ...form, username: e.target.value })}
            value={form.username}
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
            onChange={e => setForm({ ...form, password: e.target.value })}
            value={form.password}
            required
          />
        </div>
        
        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">Role</label>
          <select
            id="role"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            onChange={e => setForm({ ...form, role: e.target.value })}
            value={form.role}
            required
          >
            <option value="question-paper-setter">Question Paper Setter</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
        
        {/* Sign Up Button */}
        <button
          type="submit"
          className="w-full px-4 py-3 font-semibold text-white transition duration-150 ease-in-out bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}