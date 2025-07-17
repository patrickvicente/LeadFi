import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Sidebar from './components/layout/SideBar';
import TradingVolume from './pages/TradingVolume';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 pl-64">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/trading-volume" element={<TradingVolume />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;