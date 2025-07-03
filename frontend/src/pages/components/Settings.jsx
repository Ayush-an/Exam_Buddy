import React, { useState } from 'react';

const Settings = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <div className='bg-gradient-to-br from-purple-200 to-purple-400'>
    <div className="max-w-3xl p-6 mx-auto ">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      {/* Privacy Policy */}
      <div className="mb-4">
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="w-full text-lg font-semibold text-left text-blue-600 hover:underline"
        >
          Privacy Policy
        </button>
        {showPrivacy && (
          <div className="p-4 mt-2 bg-gray-100 rounded shadow">
            <p>
              We respect your privacy. All personal data collected is handled
              securely and never shared with third parties without your
              consent. This includes name, email, and usage patterns.
            </p>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="mb-4">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="w-full text-lg font-semibold text-left text-blue-600 hover:underline"
        >
          Terms & Conditions
        </button>
        {showTerms && (
          <div className="p-4 mt-2 bg-gray-100 rounded shadow">
            <p>
              By using this product, you agree not to misuse the services,
              attempt unauthorized access, or engage in activities that violate
              any applicable laws or regulations. All rights reserved.
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mb-4">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="w-full text-lg font-semibold text-left text-blue-600 hover:underline"
        >
          Features
        </button>
        {showFeatures && (
          <div className="p-4 mt-2 bg-gray-100 rounded shadow">
            <ul className="list-disc list-inside">
              <li>User Registration and Authentication</li>
              <li>Section-wise Exam Categories</li>
              <li>Image/Audio/Video Question Support</li>
              <li>Performance Analysis with Charts</li>
              <li>WhatsApp and Email Score Sharing</li>
              <li>Paid and Free Exam Packages</li>
              <li>Admin Panel for Content Management</li>
            </ul>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Settings;
