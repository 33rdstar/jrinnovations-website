import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './Auth/AuthContext';

// Public Pages (HomePage & Navigation load eagerly — needed on first paint)
import HomePage from './HomePage';
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
const TransactionDetail = lazy(() => import('./admin/TransactionDetail'));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'));
const ResetPassword = lazy(() => import('./Auth/ResetPassword'));

// Lazy public sub-pages — split out of the initial bundle (homepage stays eager)
const InnovationPage = lazy(() => import('./InnovationPage'));
const CreativeArtsPage = lazy(() => import('./CreativeArtsPage'));
const EntertainmentPage = lazy(() => import('./EntertainmentPage'));
const AppStore = lazy(() => import('./AppStore'));


// Resets scroll position on route change (client-side navigation doesn't do this by default).
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

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
              <ScrollToTop />
              <Suspense fallback={<div className="p-8">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/innovation" element={<InnovationPage />} />
                  <Route path="/creative-arts" element={<CreativeArtsPage />} />
                  <Route path="/entertainment" element={<EntertainmentPage />} />
                  <Route path="/app-store" element={<AppStore />} />
                </Routes>
              </Suspense>
            </>
          } />

          {/* ─── OBSCURE ADMIN ROUTES ─────────────────────────────────── */}
          <Route path="/portal-mgmt-xyz99/login" element={
            <Suspense fallback={<div className="p-8">Loading Security...</div>}>
              <AdminLogin />
            </Suspense>
          } />
          

		<Route path="/portal-mgmt-xyz99/reset-password" element={
		  <Suspense fallback={<div className="p-8">Loading…</div>}>
			<ResetPassword />
		  </Suspense>
		} />
          
          {/* Standalone full-window transaction detail (opened in a new tab from the audit table) */}
          <Route path="/portal-mgmt-xyz99/transaction/:id" element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-8">Loading…</div>}>
                <TransactionDetail />
              </Suspense>
            </ProtectedRoute>
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
			<Route path="analytics" element={<AdminAnalytics />} />
			<Route path="queries" element={<CustomerService />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
