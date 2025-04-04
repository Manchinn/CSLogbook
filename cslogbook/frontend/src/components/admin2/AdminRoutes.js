import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin, Layout } from 'antd';
import { SystemProvider } from '../../contexts/adminContext/SystemContext';
import { UserManagementProvider } from '../../contexts/adminContext/UserManagementContext';
import { DocumentProvider } from '../../contexts/adminContext/DocumentContext';

// Lazy loading components
const Dashboard = lazy(() => import('./dashboard'));
const InternshipDocs = lazy(() => import('./documents/InternshipDocs'));
const ProjectDocs = lazy(() => import('./documents/ProjectDocs'));
const StudentList = lazy(() => import('./users/students'));
const TeacherList = lazy(() => import('./users/teachers'));
const AdminUpload = lazy(() => import('../AdminUpload'));
const ConstantsSettings = lazy(() => import('./settings/constants'));

// เพิ่ม imports สำหรับหน้าตั้งค่าใหม่
const Settings = lazy(() => import('./settings')); // หน้าหลักการตั้งค่า
const AcademicSettingsPage = lazy(() => import('./settings/AcademicSettingsPage'));
const StatusSettingsPage = lazy(() => import('./settings/StatusSettingsPage'));
const CurriculumSettingsPage = lazy(() => import('./settings/CurriculumSettingsPage')); // เพิ่ม import

// Loading component
const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
    <Spin size="large" tip="กำลังโหลด..." />
  </div>
);

const AdminRoutes = () => {
  return (
    <SystemProvider>
      <UserManagementProvider>
        <Layout.Content style={{ padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
          <Suspense fallback={<LoadingComponent />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* ใช้ DocumentProvider สำหรับจัดการเอกสาร */}
              <Route path="/documents">
                <Route 
                  path="internship" 
                  element={
                    <DocumentProvider type="internship">
                      <InternshipDocs />
                    </DocumentProvider>
                  } 
                />
                <Route 
                  path="project" 
                  element={
                    <DocumentProvider type="project">
                      <ProjectDocs />
                    </DocumentProvider>
                  } 
                />
              </Route>

              <Route path="/users">
                <Route path="students" element={<StudentList />} />
                <Route path="teachers" element={<TeacherList />} />
              </Route>
              <Route path="/upload" element={<AdminUpload />} />
              <Route path="/settings">
                <Route index element={<Settings />} /> {/* หน้าหลักการตั้งค่า */}
                <Route path="constants" element={<ConstantsSettings />} /> {/* เก็บไว้เพื่อความเข้ากันได้กับโค้ดเดิม */}
                <Route path="academic" element={<AcademicSettingsPage />} /> {/* หน้าตั้งค่าปีการศึกษา */}
                <Route path="status" element={<StatusSettingsPage />} /> {/* หน้าตั้งค่าสถานะ */}
                <Route path="curriculum" element={<CurriculumSettingsPage />} /> {/* เพิ่มใน Route ของ settings */}
              </Route>
            </Routes>
          </Suspense>
        </Layout.Content>
      </UserManagementProvider>
    </SystemProvider>
  );
};

export default AdminRoutes;