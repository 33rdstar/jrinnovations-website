import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import InnovationPage from './InnovationPage';
import CreativeArtsPage from './CreativeArtsPage';
import EntertainmentPage from './EntertainmentPage';
import PageTransition from './PageTransition';
import AppStore from './AppStore';
import Navigation from './Navigation';
import PrivacyPolicy from './PrivacyPolicy';

const App = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Router>
      <Navigation />
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/innovation" element={<InnovationPage />} />
          <Route path="/creative-arts" element={<CreativeArtsPage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route path="/app-store" element={<AppStore />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </PageTransition>
    </Router>
  );
};

export default App;