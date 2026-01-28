import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
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
    }, 2000); // Animation duration

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Loading Overlay */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-white transition-all duration-500 ${
          isLoading ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Logo with pulse animation */}
          <div className="animate-logoZoom z-10">
            <img 
              src="/just Jr.png" 
              alt="JR Innovations" 
              className="h-32 w-32 object-contain"
            />
          </div>
          
          {/* Spinning circle around logo - perfectly centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-4 border-transparent border-t-purple-600 border-r-pink-600 rounded-full animate-spin" style={{ aspectRatio: '1/1' }}></div>
          </div>
          
          {/* Text below logo */}
          <div className="absolute top-full mt-8 text-center animate-pulse whitespace-nowrap">
            <p className="text-gray-600 font-semibold">Loading...</p>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div
        className={`transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {children}
      </div>

      <style jsx="true">{`
        @keyframes logoZoom {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-logoZoom {
          animation: logoZoom 0.8s ease-out;
        }
      `}</style>
    </>
  );
};

export default PageTransition;