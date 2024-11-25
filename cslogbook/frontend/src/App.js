import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentProfile from './components/StudentProfile';
import MainLayout from './components/MainLayout';
import AdminUpload from './components/AdminUpload';
import StudentList from './components/StudentList';

function App() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm setLoggedInStudent={setLoggedInStudent} />} />
        <Route element={<MainLayout loggedInStudent={loggedInStudent} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/student-profile/:id" element={<StudentProfile />} />
        </Route>
        <Route path="/" element={<LoginForm setLoggedInStudent={setLoggedInStudent} />} />
        <Route path="/admin/upload" element={<AdminUpload />} />
        <Route path="/students" element={<StudentList />} />

      </Routes>
    </Router>
  );
}

export default App;
