import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LeadManager from './pages/LeadManager';
import Campaigns from './pages/Campaigns';
import EmailLogs from './pages/EmailLogs';
import EmailTemplates from './pages/EmailTemplates';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<LeadManager />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="logs" element={<EmailLogs />} />
              <Route path="templates" element={<EmailTemplates />} />
              <Route path="setup" element={<div className="p-6"><h1 className="text-2xl font-bold">Setup Guide</h1><p>Setup guide coming soon...</p></div>} />
              <Route path="script" element={<div className="p-6"><h1 className="text-2xl font-bold">Python Script</h1><p>Python script documentation coming soon...</p></div>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;