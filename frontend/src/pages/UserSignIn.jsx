// UserSignIn.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function UserSignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
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
    setLoading(true);

    if (!form.mobile || !form.password) {
      toast.error('Please enter both your mobile number and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/login`, form);
      const { user, token } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      toast.success('Login successful!');
      navigate('/exam');

    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen px-4 bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 space-y-6 bg-white shadow-2xl rounded-xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-800">User Sign In</h2>

        <div>
          <label htmlFor="mobile" className="block mb-1 text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <input type="tel" id="mobile" name="mobile"  value={form.mobile}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="Your mobile number" required disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
            Password
          </label>
          <input type="password" id="password" name="password" value={form.password} onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="********" required disabled={loading} />
        </div>

        <button type="submit"
          className={`w-full px-4 py-3 font-semibold text-white transition duration-300 ease-in-out bg-purple-600 rounded-md shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <svg className="inline w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Sign In'
          )}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          New user? <t className="font-medium text-blue-600">Then Sign Up</t>{' '}
          
        </p>
      </form>
    </div>
  );
}
