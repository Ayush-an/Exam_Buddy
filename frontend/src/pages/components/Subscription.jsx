import React, { useState, useEffect } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import Navbar from './Navbar';
const Subscription = () => {
  const [unlockedPlan, setUnlockedPlan] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0});

  useEffect(() => {
    // Handle window size for confetti
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleSubscribe = (plan) => {
    setUnlockedPlan(plan);
    setShowConfetti(true);

    alert(`${plan} Plan Subscribed! Paid categories will now be unlocked.`);

    // Automatically hide confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      features: [
        'Access to Beginner Category',
        'Basic Questions',
        'Limited Attempts',
      ],
      isPaid: false,
      gradient: 'from-gray-100 to-gray-200',
      animationDelay: 0,
    },
    {
      name: 'Standard',
      price: '₹299',
      features: [
        'Access to Intermediate Category',
        'Image/Audio Questions',
        'Unlimited Attempts',
      ],
      isPaid: true,
      recommended: true,
      gradient: 'from-blue-100 to-blue-300',
      animationDelay: 0.2,
    },
    {
      name: 'Pro',
      price: '₹499',
      features: [
        'All Categories Access',
        'Detailed Performance Reports',
        'Early Access to New Exams',
      ],
      isPaid: true,
      gradient: 'from-purple-200 to-purple-400',
      animationDelay: 0.4,
    },
  ];

  return (
    <div>
      <Navbar />
    <div className="relative max-w-6xl px-4 py-12 mx-auto">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={400}
          recycle={false}
        />
      )}

      <h1 className="mb-12 text-4xl font-extrabold text-center text-gray-800">
        Choose Your Plan
      </h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: plan.animationDelay, duration: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            className={`relative bg-gradient-to-br ${plan.gradient} rounded-xl shadow-xl p-6 flex flex-col justify-between overflow-hidden`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white bg-yellow-500 rounded-bl-xl">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Recommended
                </div>
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">{plan.name}</h2>
              <p className="my-4 text-3xl font-extrabold text-blue-800">
                {plan.price}
              </p>
              <ul className="space-y-2 text-left text-gray-700">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={unlockedPlan === plan.name}
              className={`mt-6 w-full py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${
                unlockedPlan === plan.name
                  ? 'bg-green-500 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {unlockedPlan === plan.name ? 'Subscribed' : 'Subscribe Now'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
    </div>
  );
};
export default Subscription;