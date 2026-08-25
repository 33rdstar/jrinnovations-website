'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Star, Download, AlertCircle, Smartphone, Shield, Zap, Lightbulb, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { logEvent } from 'firebase/analytics';
import { analytics } from './Config/firebaseConfig'; // adjust path

// ─── Release config: change these in ONE place per release ──────────────────
const APP_VERSION   = '2.0.2';
const APP_UPDATED   = 'June 26 2026';
const APP_SIZE      = '86.3 MB';
const APK_FILE_NAME = 'yanga.v2.0.2.apk';
const APK_DOWNLOAD_URL =
  'https://github.com/33rdstar/jrinnovations-website/releases/download/YangaV2.0.0/yanga.v2.0.2.apk';

// ─── Hook: lazy section with IntersectionObserver ───────────────────────────
const useLazySection = (options = {}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px', ...options }
    );
    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, visible];
};

// ─── Skeleton placeholder for screenshots ───────────────────────────────────
const ScreenshotSkeleton = () => (
  <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-4 shadow-2xl mx-auto animate-pulse">
    <div className="bg-white rounded-2xl overflow-hidden h-full relative" style={{ width: '240px', height: '480px' }}>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-300 rounded-full z-10"></div>
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
        Loading preview...
      </div>
    </div>
  </div>
);

// ─── Reusable Notification Banner ───────────────────────────────────────────
const NotificationBanner = React.memo(({ notification, isTransitioning }) => {
  const Icon = notification.icon;
  return (
    <div className={`p-5 ${notification.bgColor} border ${notification.borderColor} rounded-xl shadow-lg ${notification.glowColor} backdrop-blur-sm transition-all duration-700 ease-out transform ${isTransitioning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm transition-all duration-500 ${isTransitioning ? 'rotate-12 scale-90' : 'rotate-0 scale-100'}`}>
          <Icon className={`w-6 h-6 ${notification.iconColor} transition-all duration-500`} />
        </div>
        <div className={`flex-1 transition-all duration-500 ${isTransitioning ? 'translate-x-2 opacity-70' : 'translate-x-0 opacity-100'}`}>
          <h3 className={`font-bold text-lg ${notification.titleColor} mb-1`}>{notification.title}</h3>
          <p className={`text-sm ${notification.textColor} leading-relaxed`}>{notification.message}</p>
        </div>
      </div>
    </div>
  );
});
NotificationBanner.displayName = 'NotificationBanner';

// ─── Quick Download Card (above the fold, no lazy needed) ───────────────────
const QuickDownloadCard = React.memo(({ app, onInstall }) => (
  <div className="mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-center sm:text-left">
        <h3 className="text-2xl font-bold text-white mb-2">Download {app.name}</h3>
        <p className="text-white/90 text-sm mb-1">
          Check your downloads folder or notification bar after clicking the button.
          You may need to enable "Install from Unknown Sources" in your Android settings.
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-white/80">
          <span className="bg-white/20 px-3 py-1 rounded-full">Version {app.version}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{app.size}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">⭐ {app.rating}</span>
        </div>
      </div>
      <button
        onClick={onInstall}
        className="bg-white text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transform min-w-[160px] justify-center group"
      >
        <Download className="w-5 h-5 group-hover:animate-bounce" />
        Download Now
      </button>
    </div>
  </div>
));
QuickDownloadCard.displayName = 'QuickDownloadCard';

// ─── Screenshot Gallery (lazy loaded) ───────────────────────────────────────
const ScreenshotGallery = React.memo(({ screenshots, visible }) => {
  if (!visible) {
    return (
      <div className="hidden lg:grid grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <ScreenshotSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <>
      {/* Mobile horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-6 overflow-x-auto pb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {screenshots.map((src, idx) => (
            <div key={idx} className="flex-shrink-0 relative group">
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-3 shadow-2xl group-hover:shadow-3xl transition-all duration-500 hover:scale-105" style={{ width: '190px', height: '380px' }}>
                <div className="bg-white rounded-2xl overflow-hidden h-full relative shadow-inner">
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10 shadow-lg"></div>
                  <img
                    src={src}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-gray-500 text-sm font-medium">
                    Screenshot {idx + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        {screenshots.map((src, idx) => (
          <div key={idx} className="relative group">
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-4 shadow-2xl mx-auto group-hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2" style={{ width: '240px', height: '480px' }}>
              <div className="bg-white rounded-2xl overflow-hidden h-full relative shadow-inner">
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10 shadow-lg"></div>
                <img
                  src={src}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center text-gray-500 text-sm font-medium">
                  Screenshot {idx + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
});
ScreenshotGallery.displayName = 'ScreenshotGallery';

// ─── Main App Card (details column) ─────────────────────────────────────────
const AppCard = React.memo(({ app, onInstall }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-white/20">
    <div className="p-6">
      <div className="w-full h-68 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 overflow-hidden shadow-inner">
        <img
          src="/yangalogo.png"
          alt={app.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          fetchpriority="high"
          decoding="async"
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

      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded-md"><Zap className="w-4 h-4 text-blue-600" /></div>
          Key Features
        </h4>
        <div className="flex flex-wrap gap-2">
          {app.features.slice(0, 3).map((feature, idx) => (
            <span key={idx} className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-2 rounded-full font-medium border border-blue-200/50 hover:shadow-md transition-all duration-300">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="p-1 bg-green-100 rounded-md"><Shield className="w-4 h-4 text-green-600" /></div>
          Permissions
        </h4>
        <div className="flex flex-wrap gap-2">
          {app.permissions.slice(0, 4).map((perm, idx) => (
            <span key={idx} className="text-xs bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 px-3 py-2 rounded-full font-medium border border-gray-200/50 hover:shadow-md transition-all duration-300">
              {perm}
            </span>
          ))}
        </div>
      </div>

      {app.changelog && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-800 mb-3">What's New</h4>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
            <ul className="text-xs text-gray-700 space-y-2">
              {app.changelog.slice(0, 3).map((change, idx) => (
                <li key={idx} className="flex items-start gap-2">
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
        onClick={onInstall}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center min-w-[120px] justify-center shadow-lg hover:shadow-xl hover:scale-105 transform"
      >
        <Download className="w-4 h-4 mr-2" />
        Download
      </button>
    </div>
  </div>
));
AppCard.displayName = 'AppCard';

// ─── Main AppStore Component ─────────────────────────────────────────────────
const AppStore = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isAndroid: false, isIOS: false });
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [galleryRef, galleryVisible] = useLazySection({ threshold: 0.1, rootMargin: '200px' });

  // Static data memoization
  const DOWNLOAD_URL = useMemo(() => APK_DOWNLOAD_URL, []);

  const notifications = useMemo(
    () => [
      { icon: Download, title: "Secure & Fast Downloads", message: "All Apps are hosted securely for reliable and fast downloads. No redirects or third-party links required.", bgColor: "bg-gradient-to-br from-green-50 to-emerald-50", borderColor: "border-green-200/60", iconColor: "text-green-600", titleColor: "text-green-900", textColor: "text-green-700", glowColor: "shadow-green-200/30" },
      { icon: Lightbulb, title: "Installation Tip", message: "💡 You may need to enable 'Install from Unknown Sources' in your Android settings to install App files.", bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50", borderColor: "border-blue-200/60", iconColor: "text-blue-600", titleColor: "text-blue-900", textColor: "text-blue-700", glowColor: "shadow-blue-200/30" },
      { icon: RefreshCw, title: "Stay Updated", message: "🔔 Look out for Latest Updates! We regularly release new features and improvements to enhance your experience.", bgColor: "bg-gradient-to-br from-purple-50 to-violet-50", borderColor: "border-purple-200/60", iconColor: "text-purple-600", titleColor: "text-purple-900", textColor: "text-purple-700", glowColor: "shadow-purple-200/30" },
      { icon: CheckCircle, title: "Official Platform", message: "✅ This is the only official distribution platform for Yanga. Download safely from the trusted source.", bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50", borderColor: "border-indigo-200/60", iconColor: "text-indigo-600", titleColor: "text-indigo-900", textColor: "text-indigo-700", glowColor: "shadow-indigo-200/30" },
      { icon: AlertTriangle, title: "Security Alert", message: "⚠️ Beware of fraud! Only download Yanga from this official platform. Avoid suspicious third-party sources.", bgColor: "bg-gradient-to-br from-orange-50 to-amber-50", borderColor: "border-orange-200/60", iconColor: "text-orange-600", titleColor: "text-orange-900", textColor: "text-orange-700", glowColor: "shadow-orange-200/30" }
    ],
    []
  );

  const apps = useMemo(
    () => [{
      name: "Yanga",
      developer: "JR Innovations",
      rating: 4.8,
      downloads: "1M+",
      price: "Free",
      description: "Meet elegance and modern day convenience on Yanga! Find property to rent, sell property or just go shopping on the marketplace.\n\nLooking for a plumber, carpenter or a maid? Find exactly who you are looking for on the Services Yanga feature. Check the weather, keep notes and so much more!",
      category: "Real Estate",
      apkFileName: APK_FILE_NAME,
      size: APP_SIZE,
      version: APP_VERSION,
      lastUpdated: APP_UPDATED,
      permissions: ["Internet", "Location", "Storage", "Camera"],
      features: ["Property Search", "Marketplace", "Services Directory", "Weather", "Notes"],
      screenshots: ["/ss1.jpg", "/ss2.jpg", "/ss3.jpg", "/ss4.jpg"],
      changelog: ["Added verified agent badge with ZIEA number", "Added in-app availability messaging", "Improved permissions and performance", "Bug fixes and optimizations"]
    }],
    []
  );

  // Device detection
  useEffect(() => {
    const userAgent = navigator.userAgent;
    setDeviceInfo({
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isAndroid: /Android/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent)
    });
  }, []);

  // Preconnect to GitHub (APK download domain)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://github.com';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Cycle notifications
  const cycleNotification = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
      setIsTransitioning(false);
    }, 300);
  }, [notifications.length]);

  useEffect(() => {
    const interval = setInterval(cycleNotification, 7000);
    return () => clearInterval(interval);
  }, [cycleNotification]);

  const currentNotification = notifications[currentNotificationIndex];

  const handleInstall = useCallback((app) => {
    try {
      if (!deviceInfo.isMobile) {
        setErrorMessage('📱 Please open this page on your mobile device to install the app. You can scan a QR code or send yourself the link.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      if (deviceInfo.isIOS) {
        setErrorMessage('🍎 Installation from this platform is only supported on Android devices. iOS users need to download from the App Store.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      if (!deviceInfo.isAndroid) {
        setErrorMessage('🤖 This app requires an Android device. Please try again on an Android phone or tablet.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      const downloadLink = document.createElement('a');
      downloadLink.href = DOWNLOAD_URL;
      downloadLink.download = app.apkFileName;
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => document.body.removeChild(downloadLink), 100);

      alert('📱 Download started! Check your downloads folder or notification bar. You may need to enable "Install from Unknown Sources" in your Android settings.');

		try {
		  logEvent(analytics, 'app_download', {
		  app_name: app.name,
		  app_version: app.version,
		  device_type: deviceInfo.isAndroid ? 'android' : 'other',
		  app_size: app.size,
		});
		} catch (err) {
		  console.error('Analytics error:', err);
		}

    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('❌ Download failed. Please check your internet connection and try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [deviceInfo, DOWNLOAD_URL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Helmet>
        <title>JR App Store — Download Yanga | JR Innovations Zambia</title>
        <meta
          name="description"
          content="Download the Yanga app for Android — Zambia's real estate and marketplace platform from JR Innovations. Browse verified listings and agents."
        />
        <link rel="canonical" href="https://www.jrinnovationszambia.com/app-store" />
        <meta property="og:title" content="JR App Store — Download Yanga | JR Innovations Zambia" />
        <meta
          property="og:description"
          content="Download the Yanga app for Android — Zambia's real estate and marketplace platform from JR Innovations."
        />
        <meta property="og:url" content="https://www.jrinnovationszambia.com/app-store" />
        <meta name="twitter:title" content="JR App Store — Download Yanga | JR Innovations Zambia" />
        <meta
          name="twitter:description"
          content="Download the Yanga app for Android — Zambia's real estate and marketplace platform from JR Innovations."
        />
      </Helmet>
      {/* Header */}
      <header className="relative overflow-hidden backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 25%, rgba(236, 72, 153, 0.9) 50%, rgba(251, 146, 60, 0.9) 75%, rgba(34, 197, 94, 0.9) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10"></div>
        <div className="relative z-10 max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src="/jrlogo.png"
                alt="JR Logo"
                className="h-14 w-auto drop-shadow-lg transition-transform hover:scale-105"
                fetchpriority="high"
                decoding="async"
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
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Device compatibility banners */}
        {!deviceInfo.isMobile && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl shadow-lg shadow-blue-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-blue-100 rounded-lg"><Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0" /></div>
            <div><h3 className="font-semibold text-blue-900">Mobile Device Required</h3><p className="text-sm text-blue-700 mt-1 leading-relaxed">To install, please open this page on your Android device. You can send yourself the link or use QR code scanning.</p></div>
          </div>
        )}
        {deviceInfo.isIOS && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-xl shadow-lg shadow-yellow-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-yellow-100 rounded-lg"><AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" /></div>
            <div><h3 className="font-semibold text-yellow-900">iOS Device Detected</h3><p className="text-sm text-yellow-700 mt-1 leading-relaxed">For Android devices only. iOS users should download apps from the App Store.</p></div>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 rounded-xl shadow-lg shadow-red-100/50 backdrop-blur-sm flex items-start gap-3 transition-all duration-300 hover:shadow-xl">
            <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" /></div>
            <div className="flex-1"><p className="text-red-700 font-medium">{errorMessage}</p></div>
          </div>
        )}

        {/* Notification banner */}
        <div className="mb-6">
          <NotificationBanner notification={currentNotification} isTransitioning={isTransitioning} />
          <div className="mt-4 flex gap-2 justify-center">
            {notifications.map((_, idx) => (
              <div key={idx} className={`h-2 rounded-full transition-all duration-700 ease-out ${idx === currentNotificationIndex ? `${currentNotification.iconColor.replace('text-', 'bg-')} w-8 shadow-lg` : 'bg-white/40 w-2 hover:w-3'}`} />
            ))}
          </div>
        </div>

        {/* Quick download card */}
        <QuickDownloadCard app={apps[0]} onInstall={() => handleInstall(apps[0])} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: App details */}
          <div className="w-full lg:w-1/3">
            <AppCard app={apps[0]} onInstall={() => handleInstall(apps[0])} />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          {/* Right column: Screenshots (lazy) */}
          <div className="w-full lg:w-2/3">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Preview Screenshots
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>
            <div ref={galleryRef}>
              <ScreenshotGallery screenshots={apps[0].screenshots} visible={galleryVisible} />
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-12 border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} JR Innovations Zambia. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">Yanga v{apps[0].version}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppStore;
