import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserSignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', parentMobile: '', whatsapp: '', email: '', dob: '', password: '', confirmPassword: ''
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

    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(form.mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    if (form.parentMobile && !phoneRegex.test(form.parentMobile)) {
      setError("Enter a valid parent mobile number.");
      setLoading(false);
      return;
    }

    if (form.whatsapp && !phoneRegex.test(form.whatsapp)) {
      setError("Enter a valid WhatsApp number.");
      setLoading(false);
      return;
    }

    if (!emailRegex.test(form.email)) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = form;
await axios.post(`${process.env.REACT_APP_API_URL}/user/register`, userData);
      alert('✅ Registration successful! Please sign in.');
      navigate('/user-signin');
    } catch (err) {
      console.error('Registration failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxDOB = new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center justify-center w-full min-h-screen px-4 bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl p-8 space-y-6 bg-white shadow-2xl rounded-xl"
      >
        <h2 className="text-3xl font-extrabold text-center text-gray-800">
          Create Your Account
        </h2>

        {error && (
          <div className="px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="First Name" required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last Name" required
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block mb-1 text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="tel" id="mobile" name="mobile" value={form.mobile} onChange={handleChange} pattern="[6-9]{1}[0-9]{9}"
              maxLength={10} inputMode="numeric" autoComplete="tel"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 9876543210" required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email" id="email" name="email" value={form.email} onChange={handleChange} autoComplete="email"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="abc@example.com" required
            />
          </div>
          <div>
            <label htmlFor="dob" className="block mb-1 text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date" id="dob" name="dob" value={form.dob} onChange={handleChange} max={maxDOB}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="parentMobile" className="block mb-1 text-sm font-medium text-gray-700">Parent Mobile (Optional)</label>
            <input
              type="tel" id="parentMobile" name="parentMobile" value={form.parentMobile} onChange={handleChange} pattern="[6-9]{1}[0-9]{9}"
              maxLength={10} inputMode="numeric"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 9876543210"
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block mb-1 text-sm font-medium text-gray-700">WhatsApp (Optional)</label>
            <input
              type="tel" id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} pattern="[6-9]{1}[0-9]{9}" maxLength={10}
              inputMode="numeric" autoComplete="tel" 
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 9876543210"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" id="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" minLength={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="********" required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password"
              minLength={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="********" required
            />
          </div>
        </div>

        <button type="submit"
          className="w-full px-4 py-3 font-semibold text-white transition duration-300 ease-in-out bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/auth')}
            className="font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}