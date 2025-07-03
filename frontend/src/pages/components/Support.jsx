import React, { useState } from 'react';

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to the login page, click "Forgot Password", and follow the instructions sent to your registered email.',
  },
  {
    question: 'How can I view my exam results?',
    answer: 'Go to your Profile > Performance to see a summary of all your exam attempts and scores.',
  },
  {
    question: 'Can I retake a test?',
    answer: 'Yes, you can retake any free or paid test as long as it is active in your package.',
  },
];

const Support = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleFaqToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', form);
    alert('Support request sent. We will get back to you soon!');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="bg-gradient-to-br from-purple-200 to-purple-400">
    <div className="max-w-4xl p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Support</h1>

      {/* FAQ Section */}
      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <button
                onClick={() => handleFaqToggle(index)}
                className="w-full text-lg font-medium text-left text-blue-700"
              >
                {faq.question}
              </button>
              {openIndex === index && (
                <p className="mt-2 text-gray-700">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Contact Support</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows="4"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Coming Soon Section */}
      <div className="text-center text-gray-500">
        <p>💬 Live Chat Support — Coming Soon!</p>
      </div>
    </div>
    </div>
  );
};

export default Support;
