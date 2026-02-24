import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Download } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsServicesDropdownOpen(false);
  }, [location]);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setIsServicesDropdownOpen(false);
    
    if (targetId.startsWith('/')) return;
    
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const servicesLinks = [
    { name: 'Innovation & Technology', path: '/innovation' },
    { name: 'Creative Arts & Design', path: '/creative-arts' },
    { name: 'Entertainment & Management', path: '/entertainment' }
  ];

  const toggleServicesDropdown = () => setIsServicesDropdownOpen(!isServicesDropdownOpen);
  const handleMobileMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsServicesDropdownOpen(false);
  };

  return (
    <nav className="fixed w-full bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 z-50"
            onClick={() => { setIsMenuOpen(false); setIsServicesDropdownOpen(false); }}
          >
            <img src="/just Jr.png" alt="JR Innovations Logo" className="h-16 w-auto" />
            <div>
              <div className="font-bold text-gray-800">JR Innovations</div>
              <div className="text-xs text-gray-600">beyond imagination</div>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">
              Home
            </Link>
            
            {/* Services Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleServicesDropdown}
                className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110 flex items-center space-x-1"
              >
                <span>Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isServicesDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fadeIn">
                  {servicesLinks.map((service, index) => (
                    <Link
                      key={index}
                      to={service.path}
                      className="block px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-300 font-medium"
                      onClick={() => setIsServicesDropdownOpen(false)}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isHomePage ? (
              <>
                <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">
                  About
                </a>
                <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">
                  Contact
                </a>
              </>
            ) : (
              <Link to="/#contact" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">
                Contact
              </Link>
            )}

            {/* ✨ JR App Store Button */}
            <Link
              to="/app-store"
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-300"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              }}
            >
              {/* Animated shimmer */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
                }}
              />
              <Download className="w-4 h-4 relative z-10 group-hover:animate-bounce" />
              <span className="relative z-10">JR App Store</span>
              {/* Glowing dot indicator */}
              <span className="relative z-10 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden z-50 relative" onClick={handleMobileMenuToggle}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t fixed top-20 left-0 right-0 max-h-[calc(100vh-5rem)] overflow-y-auto shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              className="block text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 py-3 px-2 rounded"
              onClick={() => { setIsMenuOpen(false); setIsServicesDropdownOpen(false); }}
            >
              Home
            </Link>
            
            {/* Mobile Services Dropdown */}
            <div className="border-b border-gray-100 pb-2">
              <button
                onClick={toggleServicesDropdown}
                className="w-full flex items-center justify-between text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 py-3 px-2 rounded"
              >
                <span>Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isServicesDropdownOpen && (
                <div className="mt-1 ml-4 space-y-1 bg-gray-50 rounded-lg p-2">
                  {servicesLinks.map((service, index) => (
                    <Link
                      key={index}
                      to={service.path}
                      className="block text-gray-600 hover:text-purple-600 hover:bg-white font-medium transition-all duration-300 py-2 px-3 rounded"
                      onClick={() => { setIsMenuOpen(false); setIsServicesDropdownOpen(false); }}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isHomePage ? (
              <>
                <a href="#about" className="block text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 py-3 px-2 rounded" onClick={(e) => handleNavClick(e, 'about')}>
                  About
                </a>
                <a href="#contact" className="block text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 py-3 px-2 rounded" onClick={(e) => handleNavClick(e, 'contact')}>
                  Contact
                </a>
              </>
            ) : (
              <Link
                to="/#contact"
                className="block text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 py-3 px-2 rounded"
                onClick={() => { setIsMenuOpen(false); setIsServicesDropdownOpen(false); }}
              >
                Contact
              </Link>
            )}

            {/* ✨ Mobile JR App Store Button */}
            <Link
              to="/app-store"
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-white mt-2 transition-all duration-300 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              <Download className="w-5 h-5" />
              <span>JR App Store</span>
              <span className="ml-auto flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </Link>
          </div>
        </div>
      )}
      
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;