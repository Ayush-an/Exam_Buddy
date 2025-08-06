import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL;
//const SERVER_BASE_URL = 'http://localhost:3000';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    dob: '',
    parentWhatsapp: '',
  });
  //const [score, setScore] = useState(0);
  const [papersAttempted, setPapersAttempted] = useState(0);
  const [examHistory, setExamHistory] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !storedUser._id) {
      navigate('/user-signin');
      return;
    }
    fetchUserProfile(storedUser._id);
    fetchExamHistory(storedUser._id);
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/users/${userId}`);
      if (res.data.status) {
        const user = res.data.user;
        setUserData(user);
     //   setScore(user.score || 0);
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          mobile: user.mobile || '',
          email: user.email || '',
          dob: user.dob?.split('T')[0] || '',
          parentWhatsapp: user.parentWhatsapp || user.whatsapp || '',
        });
        if (user.profileImage) {
          setProfileImage(`${API_BASE_URL}${user.profileImage}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchExamHistory = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/exam-history/${userId}`);
      if (res.data.status) {
        const history = res.data.history || [];
        setPapersAttempted(history.length);
        setExamHistory(history);
      }
    } catch (error) {
      console.error('Error fetching exam history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/user/users/${userData._id}`, formData);
      if (res.data.status) {
        alert('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUserData(res.data.user);
      //  setScore(res.data.user.score || 0);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file || !userData?._id) return;

    const form = new FormData();
    form.append('profileImage', file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/users/${userData._id}/profile-image`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      if (res.data.status) {
        setProfileImage(`${API_BASE_URL}${res.data.imagePath}`);
        alert('Profile image uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image');
    }
  };

  const handleProfileImageDelete = async () => {
    if (!userData?._id) return;

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/user/users/${userData._id}/profile-image`
      );
      if (res.data.status) {
        setProfileImage('');
        alert('Profile image deleted successfully!');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete image');
    }
  };

  const COLORS = ['#4ade80', '#f87171'];

  const latestExam = examHistory[0];
  const latestPieData = latestExam
    ? [
        { name: 'Scored', value: latestExam.score },
        { name: 'Missed', value: (latestExam.totalMarksPossible || 0) - latestExam.score },
      ]
    : [];

  const totalScored = examHistory.reduce((acc, exam) => acc + (exam.score || 0), 0);
  const totalPossible = examHistory.reduce((acc, exam) => acc + (exam.totalMarksPossible || 0), 0);
  const totalMissed = totalPossible - totalScored;
  const aggregatePieData =
    examHistory.length > 0
      ? [
          { name: 'Total Scored', value: totalScored },
          { name: 'Total Missed', value: totalMissed },
        ]
      : [];

  const barData = examHistory.slice(0, 10).map((exam, index) => ({
    name: `Exam ${index + 1}`,
    score: exam.score || 0,
    total: exam.totalMarksPossible || 0,
  }));

  return (
    <div className="bg-gradient-to-br from-purple-200 to-purple-400">
      <div className="max-w-6xl p-6 mx-auto space-y-6">
        {/* Profile Picture and Name */}
        <div className="text-center">
          {profileImage && (
            <img
              src={profileImage}
              alt="Profile"
              className="w-32 h-32 mx-auto mb-4 rounded-full shadow-md"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800">
            {formData.firstName} {formData.lastName}
          </h2>

          {/* Upload/Delete buttons */}
          <div className="flex flex-col items-center justify-center gap-2 mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleProfileImageUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-600"
            />
            {profileImage && (
              <button
                onClick={handleProfileImageDelete}
                className="px-4 py-1 text-white bg-red-500 rounded hover:bg-red-600"
              >
                Delete Profile Image
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 bg-white shadow-md rounded-2xl">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">Edit Profile</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {['firstName', 'lastName', 'mobile', 'email', 'dob', 'parentWhatsapp'].map((field) => (
              <input
                key={field}
                type={field === 'dob' ? 'date' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                placeholder={field.replace(/([A-Z])/g, ' $1')}
                className="p-3 border rounded-md"
              />
            ))}
            <button
              onClick={handleUpdate}
              className="col-span-1 px-4 py-2 text-white bg-blue-600 rounded-md md:col-span-2 hover:bg-blue-700"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="p-4 bg-white shadow-md rounded-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-700">Performance Summary</h3>
            <p><strong>Subscription:</strong> {userData?.packagePurchased || 'N/A'}</p>
            <p><strong>Papers Attempted:</strong> {papersAttempted}</p>
          </div>

          {latestExam && (
            <div className="p-4 bg-white shadow-md rounded-2xl">
              <h3 className="mb-2 text-lg font-semibold text-gray-700">Latest Attempt</h3>
              <p><strong>Category:</strong> {latestExam.category || 'N/A'}</p>
              <p><strong>Section:</strong> {latestExam.section || 'N/A'}</p>
              <p><strong>Set:</strong> {latestExam.set || 'N/A'}</p>
              <p><strong>Score:</strong> {latestExam.score ?? 'N/A'} / {latestExam.totalMarksPossible ?? '?'}</p>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {latestPieData.length > 0 && (
            <div className="p-4 bg-white shadow-md rounded-2xl">
              <h3 className="mb-4 text-lg font-semibold text-center text-gray-700">
                Latest Exam Chart
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={latestPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {latestPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {aggregatePieData.length > 0 && (
            <div className="p-4 bg-white shadow-md rounded-2xl">
              <h3 className="mb-4 text-lg font-semibold text-center text-gray-700">
                Overall Performance Chart
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aggregatePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {aggregatePieData.map((entry, index) => (
                      <Cell key={`cell-agg-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {barData.length > 0 && (
          <div className="p-4 bg-white shadow-md rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-center text-gray-700">Score Trend (Last 10 Exams)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#60a5fa" name="Scored Marks" />
                <Bar dataKey="total" fill="#d1d5db" name="Total Marks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="p-4 bg-white shadow-md rounded-2xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">Recent Exam History</h3>
          {examHistory.length > 0 ? (
            <ul className="space-y-4">
              {examHistory.slice(0, 10).map((exam, idx) => (
                <li key={exam._id || idx} className="pb-2 text-sm border-b">
                  <p><strong>Date:</strong> {new Date(exam.submittedAt).toLocaleString()}</p>
                  <p><strong>Category:</strong> {exam.category || 'N/A'}</p>
                  <p><strong>Section:</strong> {exam.section || 'N/A'}</p>
                  <p><strong>Set:</strong> {exam.set || 'N/A'}</p>
                  <p><strong>Score:</strong> {exam.score ?? 'N/A'} / {exam.totalMarksPossible ?? '?'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No exams attempted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;