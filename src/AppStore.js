'use client'

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, Smartphone, Bell, Clock, Rocket, Shield, Zap, Star } from 'lucide-react';

const AppStore = () => {
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isAndroid: false, isIOS: false });
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    setDeviceInfo({ isMobile, isAndroid, isIOS });

    // Generate floating particles
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(generated);
  }, []);

  const handleNotify = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setNotified(true);
      setEmail('');
    }
  };

  const features = [
    { icon: '🏠', label: 'Property Search', desc: 'Find homes to rent or buy' },
    { icon: '🛒', label: 'Marketplace', desc: 'Buy & sell with ease' },
    { icon: '🔧', label: 'Services Directory', desc: 'Plumbers, maids & more' },
    { icon: '🌤️', label: 'Weather', desc: 'Live local weather updates' },
    { icon: '📝', label: 'Notes', desc: 'Keep track of everything' },
    { icon: '⭐', label: 'Ratings', desc: 'Trusted community reviews' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">

      {/* Animated particle background */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              background: `hsl(${200 + p.id * 15}, 80%, 70%)`,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.15) 50%, rgba(236,72,153,0.15) 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-5">
          <img src="/jrlogo.png" alt="JR Logo" className="h-12 w-auto drop-shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">JR App Store</h1>
            <p className="text-white/50 text-sm">Your gateway to amazing apps</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Coming Soon Hero */}
        <div className="text-center mb-16">

          {/* Yanga Logo with orbital ring */}
          <div className="relative inline-flex items-center justify-center mb-10">
            {/* Outer orbital ring */}
            <div className="absolute w-52 h-52 rounded-full border border-white/10 animate-spin"
              style={{ animationDuration: '12s' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/60" />
            </div>
            {/* Inner orbital ring */}
            <div className="absolute w-36 h-36 rounded-full border border-white/10 animate-spin"
              style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/60" />
            </div>
            {/* Yanga Logo */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              style={{ boxShadow: '0 0 60px rgba(139,92,246,0.4), 0 0 120px rgba(59,130,246,0.2)' }}>
              <img src="/yangalogo.png" alt="Yanga App" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold tracking-widest uppercase">Coming Soon</span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            Yanga is almost
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ready for you
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            We're putting the finishing touches on Zambia's most elegant property, marketplace & services app. 
            The wait won't be long.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-10 mb-2">
            {[
              { icon: Star, label: 'Expected Rating', value: '4.8+' },
              { icon: Shield, label: 'App Size', value: '85 MB' },
              { icon: Zap, label: 'Version', value: '1.0.3' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold text-xl">{value}</span>
                </div>
                <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notify CTA */}
        <div className="mb-16 rounded-3xl p-8 sm:p-10 border border-white/10 backdrop-blur-sm relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1), rgba(236,72,153,0.1))' }}>
          <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-pink-400" />
              <h3 className="text-white font-bold text-xl">Get Notified at Launch</h3>
            </div>
            <p className="text-white/50 text-sm">Be the first to download Yanga when it drops.</p>
          </div>
          {notified ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold text-lg">You're on the list! 🎉</p>
              <p className="text-white/40 text-sm">We'll let you know the moment Yanga launches.</p>
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all duration-300 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' }}
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

        {/* Device notice (desktop only) */}
        {!deviceInfo.isMobile && (
          <div className="mb-10 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg mt-0.5">
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-300 font-semibold text-sm">Android Device Required for Download</p>
              <p className="text-blue-400/60 text-xs mt-0.5">When Yanga launches, open this page on your Android phone to install the app.</p>
            </div>
          </div>
        )}
        {deviceInfo.isIOS && (
          <div className="mb-10 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg mt-0.5">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-300 font-semibold text-sm">iOS Device Detected</p>
              <p className="text-yellow-400/60 text-xs mt-0.5">Yanga will launch on Android first. iOS support is planned for a future release.</p>
            </div>
          </div>
        )}

        {/* Disabled Download Button */}
        <div className="mb-16 rounded-2xl p-6 border border-white/5 bg-white/3 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/yangalogo.png" alt="Yanga" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-white font-bold text-lg">Yanga</span>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full ml-1">v1.0.3</span>
            </div>
            <p className="text-white/40 text-sm">Android APK • 85 MB • Free</p>
          </div>
          <button
            disabled
            className="flex items-center gap-3 px-7 py-3.5 rounded-xl font-bold text-white/30 text-sm cursor-not-allowed border border-white/10 bg-white/5 transition-all duration-300 min-w-[160px] justify-center"
          >
            <Download className="w-4 h-4" />
            Coming Soon
          </button>
        </div>

        {/* Features Preview Grid */}
        <div>
          <h3 className="text-white font-bold text-2xl mb-2 text-center">What's inside Yanga</h3>
          <p className="text-white/40 text-center text-sm mb-8">A sneak peek at what's coming</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 border border-white/5 bg-white/3 backdrop-blur-sm hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-400 group"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <p className="text-white font-semibold text-sm mb-1 group-hover:text-purple-300 transition-colors duration-300">{f.label}</p>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 text-center">
          <p className="text-white/20 text-xs">
            © 2025 JR Innovations · Yanga is developed and distributed exclusively through JR App Store
          </p>
        </div>
      </main>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default AppStore;