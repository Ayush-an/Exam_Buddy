import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import UserSignIn from './pages/UserSignIn.jsx';
import UserSignUp from './pages/UserSignUp.jsx';
import Question from './pages/Question.jsx';
import PaperSetPage from './pages/PaperSetPage.jsx';
import AnswerPage from './pages/AnswerPage.jsx';
import ViewAnswer from './pages/ViewAnswer.jsx';
import Welcome from './pages/wellcome.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/components/Settings.jsx';
import Support from './pages/components/Support.jsx';
import Subscription from './pages/components/Subscription.jsx';
import AuthPage from './pages/AuthPage.jsx';
function App() {
  return (
    <Router>
      {/* CORRECT PLACEMENT: ToastContainer should be outside of <Routes>
        but inside <Router> to be available globally across your app.
      */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        {/* Default route */}
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} /> {/* This route is redundant if "/" already points to Welcome */}

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
        <Route path="/view-answer/:userId/:examAttemptId" element={<ViewAnswer />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/support" element={<Support />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;