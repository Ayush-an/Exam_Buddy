import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserSignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    parentMobile: '',
    whatsapp: '',
    email: '',
    dob: '', // Date of Birth (will be string from input, convert to Date on backend if needed)
    password: '',
    confirmPassword: '' // For frontend validation
  });
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Destructure form data, excluding confirmPassword
      const { confirmPassword, ...userData } = form;

      // Removed 'res' variable as it's not used after the call
      await axios.post('http://localhost:3000/api/user/register', userData);
      
      alert('✅ Registration successful! Please sign in.');
      navigate('/user-signin'); // Redirect to sign-in page after successful registration
    } catch (err) {
      console.error('Registration failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={handleSubmit} className="w-full max-w-lg p-8 space-y-6 bg-white shadow-2xl rounded-xl">
        <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-800">Create Your Account</h2>
        
        {error && (
          <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="mobile" className="block mb-1 text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="tel" // Use type="tel" for mobile numbers
            id="mobile"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 9876543210"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="john.doe@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="dob" className="block mb-1 text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="********"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="********"
            required
          />
        </div>

        {/* Optional fields */}
        <div>
          <label htmlFor="parentMobile" className="block mb-1 text-sm font-medium text-gray-700">Parent Mobile (Optional)</label>
          <input
            type="tel"
            id="parentMobile"
            name="parentMobile"
            value={form.parentMobile}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 9876543210"
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="block mb-1 text-sm font-medium text-gray-700">WhatsApp (Optional)</label>
          <input
            type="tel"
            id="whatsapp"
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            className="w-full p-3 transition duration-150 ease-in-out border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 9876543210"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 font-semibold text-white transition duration-300 ease-in-out bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? {' '}
          <button
            type="button"
            onClick={() => navigate('/user-signin')}
            className="font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}
