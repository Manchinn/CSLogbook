import React, { useState } from 'react';
import { FaHome, FaBook, FaUserGraduate, FaHistory, FaClipboardCheck } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import '../style/Sidebar.css';

function Sidebar() {
  const [isStudyPlanOpen, setStudyPlanOpen] = useState(false);
  const [isInternshipOpen, setInternshipOpen] = useState(false);
  const [isClosed, setIsClosed] = useState(false); // สถานะการเปิดปิด Sidebar

  const toggleStudyPlan = () => {
    setStudyPlanOpen(!isStudyPlanOpen);
  };

  const toggleInternship = () => {
    setInternshipOpen(!isInternshipOpen);
  };

  const toggleSidebar = () => {
    setIsClosed(!isClosed);
  };

  return (
    <div className={`sidebar ${isClosed ? 'closed' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isClosed ? '☰' : '×'} {/* ปรับ icon ตามสถานะ */}
      </button>
      <div className="profile">
        <img src="https://via.placeholder.com/80" alt="Profile" className="profile-image" />
        <h3 className={`profile-name ${isClosed ? 'hidden' : ''}`}>Chinnakrit Sripan</h3>
      </div>
      <nav className="menu">
        <a href="#home" className="menu-item">
          <FaHome className="menu-icon" /> หน้าหลัก
          <span className="dropdown-arrow" />
        </a>
        <div className="menu-item" onClick={toggleStudyPlan}>
          <FaBook className="menu-icon" /> แผนการเรียน
          <span className="dropdown-arrow">{isStudyPlanOpen ? '▼' : '^'}</span>
        </div>
        {isStudyPlanOpen && (
          <div className="dropdown">
            <a href="#yearly-plan" className="dropdown-item">แผนการเรียนรายปี</a>
            <a href="#stream-plan" className="dropdown-item">แผนการเรียนตามสาขา</a>
          </div>
        )}
        <div className="menu-item" onClick={toggleInternship}>
          <FaClipboardCheck className="menu-icon" /> สมุดบันทึกการฝึกงาน
          <span className="dropdown-arrow">{isInternshipOpen ? '▼' : '^'}</span>
        </div>
        {isInternshipOpen && (
          <div className="dropdown">
            <a href="#employer-status" className="dropdown-item">ข้อมูลสถานะนายจ้าง</a>
            <a href="#attendance" className="dropdown-item">การเข้าทำงานและรายละเอียด</a>
            <a href="#internship-logs" className="dropdown-item">บันทึกการฝึกงาน</a>
          </div>
        )}
        <a href="#degree" className="menu-item">
          <FaUserGraduate className="menu-icon" /> ปริญญานิพนธ์
          <span className="dropdown-arrow" />
        </a>
        <a href="#resume" className="menu-item">
          <FaHistory className="menu-icon" /> ประวัติย่อฉบับ
          <span className="dropdown-arrow" />
        </a>
        <a href="#plan" className="menu-item">
          <FaClipboardCheck className="menu-icon" /> แผนควบคุม
          <span className="dropdown-arrow" />
        </a>
      </nav>
      <button className="logout">
        <MdLogout className="menu-icon" /> Log out
      </button>
    </div>
  );
}

export default Sidebar;
