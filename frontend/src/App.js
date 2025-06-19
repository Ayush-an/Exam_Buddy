import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Page Imports
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import UserSignIn from './pages/UserSignIn.jsx';
import UserSignUp from './pages/UserSignUp.jsx';
import Question from './pages/Question.jsx';
import PaperSetPage from './pages/PaperSetPage.jsx';
import AnswerPage from './pages/AnswerPage.jsx';
import ViewAnswer from './pages/ViewAnswer.jsx'; // Corrected import path casing
import Welcome from './pages/wellcome.jsx'; // Corrected import path casing

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        
<Route path="/" element={<Welcome />} />

<Route path="/welcome" element={<Welcome />} />
        {/* Admin routes */}
        <Route path="/admin-signin" element={<SignIn />} />
        <Route path="/admin-signup" element={<SignUp />} />
        <Route path="/question" element={<Question />} />
        <Route path="/paper-set" element={<PaperSetPage />} />

        {/* User routes */}
        <Route path="/user-signin" element={<UserSignIn />} />
        <Route path="/user-signup" element={<UserSignUp />} />
        <Route path="/exam" element={<AnswerPage />} />
        
        {/* The correct route for viewing a completed exam attempt */}
        <Route path="/view-answer/:userId/:attemptId" element={<ViewAnswer />} />

        
      </Routes>
    </Router>
  );
}

export default App;