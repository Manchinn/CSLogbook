import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Ensure your CSS file is updated

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [learningPlanOpen, setLearningPlanOpen] = useState(false);
  const [internshipPlanOpen, setInternshipPlanOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>
      {isSidebarOpen && (
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <Link to="/dashboard" className="sidebar-item">
                <span className="icon">🏠</span>
                Home
              </Link>
            </li>
            <hr className="divider" />
            <li>
              <div onClick={() => setLearningPlanOpen(!learningPlanOpen)} className="sidebar-item sidebar-toggle">
                <span className="icon">📚</span>
                Learning Plan
                <span className="arrow">{learningPlanOpen ? '▲' : '▼'}</span>
              </div>
              {learningPlanOpen && (
                <ul className="sidebar-submenu">
                  <li>
                    <Link to="/yearly-learning-plan" className="sidebar-subitem">Yearly Learning Plan</Link>
                  </li>
                  <li>
                    <Link to="/learning-plan-by-stream" className="sidebar-subitem">Learning Plan by Stream</Link>
                  </li>
                </ul>
              )}
            </li>
            <hr className="divider" />
            <li>
              <div onClick={() => setInternshipPlanOpen(!internshipPlanOpen)} className="sidebar-item sidebar-toggle">
                <span className="icon">📊</span>
                Internship Plan
                <span className="arrow">{internshipPlanOpen ? '▲' : '▼'}</span>
              </div>
              {internshipPlanOpen && (
                <ul className="sidebar-submenu">
                  <li>
                    <Link to="/employer-status" className="sidebar-subitem">Employer Status Information</Link>
                  </li>
                  <li>
                    <Link to="/work-attendance" className="sidebar-subitem">Work Attendance and Details</Link>
                  </li>
                  <li>
                    <Link to="/internship-logs" className="sidebar-subitem">Internship Logs</Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
