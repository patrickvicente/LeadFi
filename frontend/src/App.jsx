import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Demo from './pages/Demo';
import DemoSelection from './pages/DemoSelection';
import Sidebar from './components/layout/SideBar';
import DemoBanner from './components/common/DemoBanner';
import TradingVolume from './pages/TradingVolume';
import ErrorBoundary from './components/common/ErrorBoundary';
import { DemoProvider } from './contexts/DemoContext';
import AuthGuard from './components/auth/AuthGuard';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <DemoProvider>
          <Router>
            <AuthGuard>
              <Routes>
                {/* Public routes (no sidebar) */}
                <Route path="/demo" element={<Demo />} />
                <Route path="/demo-selection" element={<DemoSelection />} />
                
                {/* Protected routes (with sidebar) */}
                <Route path="/*" element={
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 pl-64">
                      <DemoBanner />
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/leads" element={<Leads />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/activity" element={<Activity />} />
                          <Route path="/trading-volume" element={<TradingVolume />} />
                        </Routes>
                      </ErrorBoundary>
                    </main>
                  </div>
                } />
              </Routes>
            </AuthGuard>
          </Router>
        </DemoProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;