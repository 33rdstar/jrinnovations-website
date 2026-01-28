import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 relative z-10">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/just Jr.png" 
            alt="JR Innovations Logo" 
            className="h-16 w-auto"
          />
        </div>
        <p className="text-gray-400 mb-6">JR Innovations - Beyond Imagination</p>
        <p className="text-gray-500 text-sm">
          © 2026 JR Innovations. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;