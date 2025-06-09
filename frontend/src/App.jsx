import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Sidebar from './components/layout/SideBar';

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/activity" element={<Activity />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;