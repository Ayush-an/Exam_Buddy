import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn.jsx'; // Added .jsx extension
import SignUp from './pages/SignUp.jsx'; // Added .jsx extension
import Question from './pages/Question.jsx'; // Added .jsx extension
import PaperSetPage from './pages/PaperSetPage.jsx'; // Added .jsx extension

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Route for Question Paper Setters */}
        <Route path="/question" element={<Question />} />
        {/* Route for Moderators */}
        <Route path="/paper-set" element={<PaperSetPage />} />

        {/* Add any other routes for your application here */}
        {/* Example for a generic admin dashboard if roles don't match specific pages */}
        {/* <Route path="/admin-dashboard" element={<div>Admin Dashboard (Generic)</div>} /> */}
      </Routes>
    </Router>
  );
}

export default App;
