import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// IMPORTANT: These paths assume App.js is in 'src/' and ALL page components
// (SignIn.jsx, SignUp.jsx, UserSignIn.jsx, etc.) are directly inside 'src/pages/'.
import SignIn from './pages/SignIn.jsx'; // Admin SignIn
import SignUp from './pages/SignUp.jsx'; // Admin SignUp
import UserSignIn from './pages/UserSignIn.jsx'; // User SignIn
import UserSignUp from './pages/UserSignUp.jsx'; // User SignUp
import Question from './pages/Question.jsx';
import PaperSetPage from './pages/PaperSetPage.jsx';
import AnswerPage from './pages/AnswerPage.jsx'; // Exam page for users

function App() {
  return (
    // The entire application is wrapped in <Router> to provide routing context
    <Router>
      <Routes>
        {/* Default route for the application, typically a login or homepage */}
        <Route path="/" element={<UserSignIn />} /> 

        {/* Admin related routes */}
        <Route path="/admin-signin" element={<SignIn />} />
        <Route path="/admin-signup" element={<SignUp />} />
        <Route path="/question" element={<Question />} />
        <Route path="/paper-set" element={<PaperSetPage />} />

        {/* User related routes */}
        <Route path="/user-signin" element={<UserSignIn />} />
        <Route path="/user-signup" element={<UserSignUp />} />
        <Route path="/exam" element={<AnswerPage />} /> {/* User's exam page */}

        {/* Add any other general routes here */}
      </Routes>
    </Router>
  );
}

export default App;
