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
const AdminUpload = lazy(() => import('../AdminUpload')); //
const ConstantsSettings = lazy(() => import('./settings/constants')); // ใช้ lazy loading

// ใช้คอมโพเนนต์เดิมก่อน

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
                <Route path="constants" element={<ConstantsSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </Layout.Content>
      </UserManagementProvider>
    </SystemProvider>
  );
};

export default AdminRoutes;