import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import InnovationPage from './InnovationPage';
import CreativeArtsPage from './CreativeArtsPage';
import EntertainmentPage from './EntertainmentPage';
import PageTransition from './PageTransition';

const App = () => {
  useEffect(() => {
    // Add smooth scroll behavior globally
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Router>
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/innovation" element={<InnovationPage />} />
          <Route path="/creative-arts" element={<CreativeArtsPage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
        </Routes>
      </PageTransition>
    </Router>
  );
};

export default App;