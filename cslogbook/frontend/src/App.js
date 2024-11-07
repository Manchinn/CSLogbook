import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentProfile from './components/StudentProfile'; // เพิ่มการนำเข้า

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student/:studentID" element={<StudentProfile />} /> {/* กำหนด route ที่ใช้ studentID */}
        <Route path="/" element={<LoginForm />} />  {/* กำหนดให้ไปที่หน้า login เป็นค่าเริ่มต้น */}
      </Routes>
    </Router>
  );
}

export default App;
