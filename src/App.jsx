import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './Auth/AuthContext';

// Public Pages (HomePage & Navigation load eagerly — needed on first paint)
import HomePage from './HomePage';
import Navigation from './Navigation';

// Admin Guards
import ProtectedRoute from './Auth/ProtectedRoute';
import HostRoute from './stays/host/HostRoute';
//import OfficerRoute from './Auth/OfficerRoute';

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
const StaysManager = lazy(() => import('./admin/StaysManager'));

// Yanga Stays — public registration and the accommodation-business dashboard
const YangaHomes = lazy(() => import('./stays/YangaHomes'));
const StayRegister = lazy(() => import('./stays/StayRegister'));
const HostLogin = lazy(() => import('./stays/host/HostLogin'));
const HostSetPassword = lazy(() => import('./stays/host/HostSetPassword'));
const HostLayout = lazy(() => import('./stays/host/HostLayout'));
const HostBookings = lazy(() => import('./stays/host/HostBookings'));
const HostRooms = lazy(() => import('./stays/host/HostRooms'));
const HostCalendar = lazy(() => import('./stays/host/HostCalendar'));
const HostProfile = lazy(() => import('./stays/host/HostProfile'));

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

          {/* ─── YANGA HOMES: public landing page (own Yanga-themed header) ─ */}
          <Route path="/yangahomes" element={
            <Suspense fallback={<div className="p-8">Loading…</div>}>
              <YangaHomes />
            </Suspense>
          } />

          <Route path="/register" element={
            <Suspense fallback={<div className="p-8">Loading…</div>}>
              <StayRegister />
            </Suspense>
          } />

          {/* ─── YANGA STAYS: BUSINESS DASHBOARD ──────────────────────── */}
          <Route path="/host/login" element={
            <Suspense fallback={<div className="p-8">Loading…</div>}>
              <HostLogin />
            </Suspense>
          } />
          <Route path="/host/set-password" element={
            <Suspense fallback={<div className="p-8">Loading…</div>}>
              <HostSetPassword />
            </Suspense>
          } />
          <Route path="/host/reset-password" element={
            <Suspense fallback={<div className="p-8">Loading…</div>}>
              <ResetPassword />
            </Suspense>
          } />
          <Route path="/host" element={
            <HostRoute>
              <Suspense fallback={<div className="p-8">Loading…</div>}>
                <HostLayout />
              </Suspense>
            </HostRoute>
          }>
            <Route index element={<Navigate to="bookings" replace />} />
            <Route path="bookings" element={<HostBookings />} />
            <Route path="rooms" element={<HostRooms />} />
            <Route path="calendar" element={<HostCalendar />} />
            <Route path="profile" element={<HostProfile />} />
          </Route>

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
			<Route path="stays" element={<StaysManager />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
