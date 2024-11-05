import React from 'react';
import Sidebar from './Sidebar';
import MainContent from '../components/MainContent';

const Dashboard = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 'auto' }}> {/* Sidebar background */}
        <Sidebar />
      </div>
      <div style={{ flexGrow: 1, display: 'flex',  backgroundColor: '#C6DBFF' }}>
        <MainContent />
      </div>
    </div>
  );
};

export default Dashboard;
