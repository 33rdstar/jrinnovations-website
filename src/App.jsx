import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Auth/AuthContext';

// Public Pages
import HomePage from './HomePage';
import InnovationPage from './InnovationPage';
import CreativeArtsPage from './CreativeArtsPage';
import EntertainmentPage from './EntertainmentPage';
import PageTransition from './PageTransition';
import AppStore from './AppStore';
import Navigation from './Navigation';

// Admin Guards
import ProtectedRoute from './Auth/ProtectedRoute';
import OfficerRoute from './Auth/OfficerRoute';

// Lazy Load Admin Pages (Only downloads if the user visits the route)
const AdminLogin = lazy(() => import('./Auth/AdminLogin'));
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'));
const UserManagerComponent = lazy(() => import('./admin/UserManagerComponent'));
const ListingsPage = lazy(() => import('./admin/ListingsManager'));
const MarketplaceManager = lazy(() => import('./admin/MarketplaceManager'));
const CustomerService = lazy(() => import('./admin/CustomerService'));
const AdminTransactions = lazy(() => import('./admin/AdminTransactions'));


const App = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ─── PUBLIC APP ROUTES ────────────────────────────────────── */}
          <Route path="/*" element={
            <>
              <Navigation />
              <PageTransition>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/innovation" element={<InnovationPage />} />
                  <Route path="/creative-arts" element={<CreativeArtsPage />} />
                  <Route path="/entertainment" element={<EntertainmentPage />} />
                  <Route path="/app-store" element={<AppStore />} />
                </Routes>
              </PageTransition>
            </>
          } />

          {/* ─── OBSCURE ADMIN ROUTES ─────────────────────────────────── */}
          <Route path="/portal-mgmt-xyz99/login" element={
            <Suspense fallback={<div className="p-8">Loading Security...</div>}>
              <AdminLogin />
            </Suspense>
          } />
          
          <Route path="/portal-mgmt-xyz99" element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-8">Loading Dashboard...</div>}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }>
            {/* Nested Admin Pages */}
            <Route path="users" element={<UserManagerComponent />} />
            {/* Add more routes here like <Route path="queries" element={<QueriesManager />} /> */}
            <Route path="listings" element={
			  <ListingsPage />
			} />
			<Route path="marketplace" element={<MarketplaceManager />} />
			<Route path="audits" element={<AdminTransactions />} />
			<Route path="queries" element={<CustomerService />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
