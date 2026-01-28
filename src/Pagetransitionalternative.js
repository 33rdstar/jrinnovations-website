import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransitionAlternative = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading animation
    setIsLoading(true);

    // Scroll to top on page change
    window.scrollTo(0, 0);

    // End loading animation after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Animation duration

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Loading Overlay with gradient background */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 transition-all duration-700 ${
          isLoading ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="relative flex flex-col items-center">
          {/* Logo container with animated background */}
          <div className="relative flex items-center justify-center">
            {/* Animated rings - perfectly circular */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-white/30 rounded-full animate-ping-slow" style={{ aspectRatio: '1/1' }}></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-4 border-white/50 rounded-full animate-pulse-slow" style={{ aspectRatio: '1/1' }}></div>
            </div>
            
            {/* Logo with scale and rotate animation */}
            <div className="relative z-10 bg-white rounded-full p-6 shadow-2xl animate-logoReveal w-36 h-36 flex items-center justify-center">
              <img 
                src="/just Jr.png" 
                alt="JR Innovations" 
                className="w-24 h-24 object-contain"
              />
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="text-center mt-8">
            <p className="text-white font-bold text-xl animate-pulse">
              Loading
              <span className="animate-dots">...</span>
            </p>
            <p className="text-white/80 text-sm mt-2 animate-fadeInUp">
              beyond imagination
            </p>
          </div>
        </div>
      </div>

      {/* Page Content with fade transition */}
      <div
        className={`transition-all duration-700 ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {children}
      </div>

      <style jsx="true">{`
        @keyframes logoReveal {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.15) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pingSlow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes pulseSlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes dots {
          0%, 20% {
            content: '.';
          }
          40% {
            content: '..';
          }
          60%, 100% {
            content: '...';
          }
        }

        .animate-logoReveal {
          animation: logoReveal 1s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .animate-ping-slow {
          animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-dots::after {
          content: '...';
          animation: dots 1.5s steps(4, end) infinite;
        }
      `}</style>
    </>
  );
};

export default PageTransitionAlternative;