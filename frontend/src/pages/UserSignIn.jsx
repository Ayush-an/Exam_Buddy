import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserSignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/api/user/login', form);
      const { user, token } = res.data; // Backend sends { user: ..., token: ... }

      // Store user object and token in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token); // Store token for future authenticated requests

      alert('✅ Login successful!');
      navigate('/exam'); // Navigate to the exam page
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 to-pink-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 space-y-6 bg-white shadow-2xl rounded-xl">
        <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-800">User Sign In</h2>
        
        {error && (
          <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="mobile" className="block mb-1 text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="tel"
            id="mobile"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="Your mobile number"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="********"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 font-semibold text-white transition duration-300 ease-in-out bg-purple-600 rounded-md shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          New user? {' '}
          <button
            type="button"
            onClick={() => navigate('/user-signup')}
            className="font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}
