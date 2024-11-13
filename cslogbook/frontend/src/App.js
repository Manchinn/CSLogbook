import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentProfile from './components/StudentProfile';
import MainLayout from './components/MainLayout';
import AdminUpload from './components/AdminUpload';

function App() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm setLoggedInStudent={setLoggedInStudent} />} />
        <Route element={<MainLayout loggedInStudent={loggedInStudent} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/student-profile/:studentID" element={<StudentProfile student={loggedInStudent} />} />
        </Route>
        <Route path="/" element={<LoginForm setLoggedInStudent={setLoggedInStudent} />} />
        <Route path="/admin/upload" element={<AdminUpload />} />

      </Routes>
    </Router>
  );
}

export default App;
