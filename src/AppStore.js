'use client'

import React, { useState, useEffect } from 'react';
import { Star, Download, AlertCircle, Smartphone, Shield, Zap, Lightbulb, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const AppStore = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isAndroid: false, isIOS: false });
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Firebase Storage download URL
  const DOWNLOAD_URL = 'https://github.com/33rdstar/jrinnovations-website/releases/download/YangaV2.0.0/Yanga.Mobile.v2.apk';
  
  // Dynamic notifications that cycle every 7 seconds
  const notifications = [
    {
      icon: Download,
      title: "Secure & Fast Downloads",
      message: "All Apps are hosted securely for reliable and fast downloads. No redirects or third-party links required.",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200/60",
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      textColor: "text-green-700",
      glowColor: "shadow-green-200/30"
    },
    {
      icon: Lightbulb,
      title: "Installation Tip",
      message: "💡 You may need to enable 'Install from Unknown Sources' in your Android settings to install App files.",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200/60",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      textColor: "text-blue-700",
      glowColor: "shadow-blue-200/30"
    },
    {
      icon: RefreshCw,
      title: "Stay Updated",
      message: "🔔 Look out for Latest Updates! We regularly release new features and improvements to enhance your experience.",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
      borderColor: "border-purple-200/60",
      iconColor: "text-purple-600",
      titleColor: "text-purple-900",
      textColor: "text-purple-700",
      glowColor: "shadow-purple-200/30"
    },
    {
      icon: CheckCircle,
      title: "Official Platform",
      message: "✅ Look out for the LatestThis is the only official distribution platform for Yanga. Download safely from the trusted source.",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
      borderColor: "border-indigo-200/60",
      iconColor: "text-indigo-600",
      titleColor: "text-indigo-900",
      textColor: "text-indigo-700",
      glowColor: "shadow-indigo-200/30"
    },
    {
      icon: AlertTriangle,
      title: "Security Alert",
      message: "⚠️ Beware of fraud! Only download Yanga from this official platform. Avoid suspicious third-party sources.",
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
      borderColor: "border-orange-200/60",
      iconColor: "text-orange-600",
      titleColor: "text-orange-900",
      textColor: "text-orange-700",
      glowColor: "shadow-orange-200/30"
    }
  ];
  
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    setDeviceInfo({ isMobile, isAndroid, isIOS });
  }, []);

  // Cycle through notifications every 7 seconds with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentNotificationIndex((prevIndex) => 
          (prevIndex + 1) % notifications.length
        );
        setIsTransitioning(false);
      }, 300);
    }, 7000);

    return () => clearInterval(interval);
  }, [notifications.length]);
  
  const apps = [
    {
      name: "Yanga",
      developer: "JR Innovations",
      rating: 4.8,
      downloads: "1M+",
      price: "Free",
      description: "Meet elegance and modern day convenience on Yanga! Find property to rent, sell property or just go shopping on the marketplace. \n\n" +
      "Looking for a plumber, carpenter or a maid? Find exactly who you are looking for on the Services Yanga feature. Check the weather, keep notes and so much more!",
      category: "Real Estate",
      apkFileName: "yanga_mobile_app(v1).apk",
      size: "85 MB",
      version: "1.0.3(b1)",
      lastUpdated: "July 21 2025",
      permissions: ["Internet", "Location", "Storage", "Camera"],
      features: ["Property Search", "Marketplace", "Services Directory", "Weather", "Notes"],
      screenshots: ["/ss1.png", "/ss2.jpg", "/ss3.jpg", "/ss4.jpg"],
      changelog: [
        "Fixed property search filters",
        "Added Services Directory",
        "Improved marketplace performance",
        "Bug fixes and optimizations"
      ]
    }
  ];

  const handleInstall = (app) => {
    try {
      // Enhanced device detection
      if (!deviceInfo.isMobile) {
        setErrorMessage('📱 Please open this page on your mobile device to install the app. You can scan a QR code or send yourself the link.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (deviceInfo.isIOS) {
        setErrorMessage('🍎 Installation from this plateform is only supported on Android devices. iOS users need to download from the App Store.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (!deviceInfo.isAndroid) {
        setErrorMessage('🤖 This app requires an Android device. Please try again on an Android phone or tablet.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Create download link and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = DOWNLOAD_URL;
      downloadLink.download = app.apkFileName;
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      
      // Style the link to be invisible
      downloadLink.style.display = 'none';
      
      // Add to DOM temporarily
      document.body.appendChild(downloadLink);
      
      // Trigger the download
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
      }, 100);

      // Show success alert
      alert('📱 Download started! Check your downloads folder or notification bar. You may need to enable "Install from Unknown Sources" in your Android settings.');

      // Optional: Track download analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'app_download', {
          'app_name': app.name,
          'app_version': app.version
        });
      }

    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('❌ Download failed. Please check your internet connection and try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const currentNotification = notifications[currentNotificationIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header with modern gradient pattern */}
      <header className="relative overflow-hidden backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 25%, rgba(236, 72, 153, 0.9) 50%, rgba(251, 146, 60, 0.9) 75%, rgba(34, 197, 94, 0.9) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10"></div>
        <div className="relative z-10 max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src="/jrlogo.png"
                alt="JR Logo"
                className="h-14 w-auto drop-shadow-lg transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 bg-white/20 rounded-lg blur-xl -z-10"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-md bg-gradient-to-r from-white to-white/90 bg-clip-text">
                JR App Store
              </h1>
              <p className="mt-2 text-white/90 text-lg font-medium drop-shadow-sm">
                Discover amazing Apps
              </p>
            </div>
          </div>
        </div>
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Device Compatibility Banner */}
        {!deviceInfo.isMobile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl shadow-lg shadow-blue-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Mobile Device Required</h3>
              <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                To install, please open this page on your Android device. You can send yourself the link or use QR code scanning.
              </p>
            </div>
          </div>
        )}

        {deviceInfo.isIOS && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-xl shadow-lg shadow-yellow-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900">iOS Device Detected</h3>
              <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                For Android devices only. iOS users should download apps from the App Store.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-xl shadow-lg shadow-red-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-red-700 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Enhanced Dynamic Notification Section with Smooth Transitions */}
        <div className={`mb-6 p-5 ${currentNotification.bgColor} border ${currentNotification.borderColor} rounded-xl shadow-lg ${currentNotification.glowColor} backdrop-blur-sm transition-all duration-700 ease-out transform ${isTransitioning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm transition-all duration-500 ${isTransitioning ? 'rotate-12 scale-90' : 'rotate-0 scale-100'}`}>
              <currentNotification.icon className={`w-6 h-6 ${currentNotification.iconColor} transition-all duration-500`} />
            </div>
            <div className={`flex-1 transition-all duration-500 ${isTransitioning ? 'translate-x-2 opacity-70' : 'translate-x-0 opacity-100'}`}>
              <h3 className={`font-bold text-lg ${currentNotification.titleColor} mb-1`}>
                {currentNotification.title}
              </h3>
              <p className={`text-sm ${currentNotification.textColor} leading-relaxed`}>
                {currentNotification.message}
              </p>
            </div>
          </div>
          
          {/* Enhanced Progress indicator with smooth animations */}
          <div className="mt-4 flex gap-2 justify-center">
            {notifications.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-700 ease-out ${
                  index === currentNotificationIndex 
                    ? `${currentNotification.iconColor.replace('text-', 'bg-')} w-8 shadow-lg` 
                    : 'bg-white/40 w-2 hover:w-3'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Download Section - New Addition */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Download
              </h3>
              <p className="text-white/90 text-sm mb-1">
                Check your downloads folder or notification bar after clicking the button. You may need to enable "Install from Unknown Sources" in your Android settings.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-white/80">
                <span className="bg-white/20 px-3 py-1 rounded-full">Version {apps[0].version}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">{apps[0].size}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">⭐ {apps[0].rating}</span>
              </div>
            </div>
            <button 
              className="bg-white text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transform min-w-[160px] justify-center group"
              onClick={() => handleInstall(apps[0])}
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Download Now
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced App Card */}
          <div className="w-full lg:w-1/3">
            {apps.map((app) => (
              <div key={app.name} className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-white/20">
                <div className="p-6">
                  <div className="w-full h-68 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 overflow-hidden shadow-inner">
                    <img
                      src="/yangalogo.png"
                      alt={app.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{app.name}</h2>
                  <p className="text-sm text-gray-600 font-medium">{app.developer}</p>
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-1 rounded-full inline-block">
                    Version {app.version} • Updated {app.lastUpdated}
                  </p>
                </div>
                
                <div className="px-6 pb-6">
                  <p className="text-sm mb-6 text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl">
                    {app.description}
                  </p>
                  
                  {/* Enhanced App Stats */}
                  <div className="flex items-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700 font-semibold">{app.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                      <Download className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700 font-semibold">{app.size}</span>
                    </div>
                  </div>

                  {/* Enhanced Key Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      Key Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {app.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-2 rounded-full font-medium border border-blue-200/50 hover:shadow-md transition-all duration-300">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Permissions */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="p-1 bg-green-100 rounded-md">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      Permissions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {app.permissions.slice(0, 4).map((permission, index) => (
                        <span key={index} className="text-xs bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 px-3 py-2 rounded-full font-medium border border-gray-200/50 hover:shadow-md transition-all duration-300">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced What's New */}
                  {app.changelog && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">What's New</h4>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                        <ul className="text-xs text-gray-700 space-y-2">
                          {app.changelog.slice(0, 3).map((change, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1 font-bold">•</span>
                              <span className="leading-relaxed">{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-r from-slate-800 via-blue-900 to-purple-900 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    {app.category}
                  </span>
                  <button 
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center min-w-[120px] justify-center shadow-lg hover:shadow-xl hover:scale-105 transform"
                    onClick={() => handleInstall(app)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Divider */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
          
          {/* Enhanced Screenshots Section */}
          <div className="w-full lg:w-2/3">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Preview Screenshots
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>
            
            {/* Mobile View - Enhanced Horizontal Scroll */}
            <div className="lg:hidden">
              <div className="flex gap-6 overflow-x-auto pb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {apps[0].screenshots.map((screenshot, index) => (
                  <div key={index} className="flex-shrink-0 relative group">
                    <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-3 shadow-2xl group-hover:shadow-3xl transition-all duration-500 hover:scale-105" style={{ width: '190px', height: '380px' }}>
                      <div className="bg-white rounded-2xl overflow-hidden h-full relative shadow-inner">
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10 shadow-lg"></div>
                        <img
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-gray-500 text-sm font-medium">
                          Screenshot {index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop View - Enhanced Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-6">
              {apps[0].screenshots.map((screenshot, index) => (
                <div key={index} className="relative group">
                  <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-4 shadow-2xl mx-auto group-hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2" style={{ width: '240px', height: '480px' }}>
                    <div className="bg-white rounded-2xl overflow-hidden h-full relative shadow-inner">
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10 shadow-lg"></div>
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-gray-500 text-sm font-medium">
                        Screenshot {index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppStore;