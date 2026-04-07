import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Download, Home, Briefcase, Info, Mail, Store, X, ChevronRight } from 'lucide-react';

const Navigation = () => {
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    setIsServicesDropdownOpen(false);
    setMobileServicesOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const servicesLinks = [
    { name: 'Innovation & Technology', path: '/innovation', color: '#3b82f6' },
    { name: 'Creative Arts & Design', path: '/creative-arts', color: '#ec4899' },
    { name: 'Entertainment & Management', path: '/entertainment', color: '#10b981' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ===== DESKTOP NAV ===== */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm shadow-md z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/just Jr.png" alt="JR Innovations Logo" className="h-16 w-auto" />
              <div>
                <div className="font-bold text-gray-800">JR Innovations</div>
                <div className="text-xs text-gray-600">beyond imagination</div>
              </div>
            </Link>

            <div className="flex space-x-8 items-center">
              <Link to="/" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">Home</Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                  className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110 flex items-center space-x-1"
                >
                  <span>Services</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isServicesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                    {servicesLinks.map((service, index) => (
                      <Link key={index} to={service.path} className="block px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-300 font-medium" onClick={() => setIsServicesDropdownOpen(false)}>
                        {service.emoji} {service.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <a href="/#about" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">About</a>
              <a href="/#contact" className="text-gray-700 hover:text-purple-600 transition-all duration-300 font-medium hover:scale-110">Contact</a>

              <Link
                to="/app-store"
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' }}
              >
                <Download className="w-4 h-4" />
                <span>JR App Store</span>
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE TOP BAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/just Jr.png" alt="JR Innovations Logo" style={{ height: '48px', width: 'auto' }} />
            <div>
              <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>JR Innovations</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>beyond imagination</div>
            </div>
          </a>
          <a href="/app-store" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', color: 'white', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
            <Download size={14} />
            App Store
          </a>
        </div>

        {/* Services expandable panel */}
        {mobileServicesOpen && (
          <div style={{ background: '#e6eeff', borderTop: '1px solid #f3f4f6', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 12px' }}>
              <span style={{ fontWeight: '700', color: '#374151', fontSize: '15px' }}>Our Services</span>
              <button onClick={() => setMobileServicesOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            {servicesLinks.map((service, index) => (
              <a
                key={index}
                href={service.path}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', textDecoration: 'none', borderTop: index > 0 ? '1px solid #f9fafb' : 'none' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${service.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {service.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{service.name}</div>
                </div>
                <ChevronRight size={16} style={{ color: '#9ca3af' }} />
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 -2px 20px rgba(0,0,0,0.1)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0' }}>

          <a href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', padding: '6px 12px', borderRadius: '12px', minWidth: '56px', background: isActive('/') ? '#f3f0ff' : 'transparent' }}>
            <Home size={22} style={{ color: isActive('/') ? '#7c3aed' : '#6b7280' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: isActive('/') ? '#7c3aed' : '#6b7280' }}>Home</span>
          </a>

          <button
            onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', padding: '6px 12px', borderRadius: '12px', minWidth: '56px', background: mobileServicesOpen ? '#f3f0ff' : 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Briefcase size={22} style={{ color: mobileServicesOpen ? '#7c3aed' : '#6b7280' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: mobileServicesOpen ? '#7c3aed' : '#6b7280' }}>Services</span>
          </button>

          <a href="/#about" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', padding: '6px 12px', borderRadius: '12px', minWidth: '56px' }}>
            <Info size={22} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280' }}>About</span>
          </a>

          <a href="/#contact" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', padding: '6px 12px', borderRadius: '12px', minWidth: '56px' }}>
            <Mail size={22} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280' }}>Contact</span>
          </a>

          <a href="/app-store" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', padding: '6px 12px', borderRadius: '12px', minWidth: '56px', background: isActive('/app-store') ? '#f3f0ff' : 'transparent' }}>
            <Store size={22} style={{ color: isActive('/app-store') ? '#7c3aed' : '#6b7280' }} />
            <span style={{ fontSize: '10px', fontWeight: '600', color: isActive('/app-store') ? '#7c3aed' : '#6b7280' }}>App Store</span>
          </a>

        </div>
      </div>

      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden" style={{ height: '65px' }}></div>
    </>
  );
};

export default Navigation;