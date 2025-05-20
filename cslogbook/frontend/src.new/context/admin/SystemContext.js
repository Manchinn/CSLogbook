import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../context/auth/AuthContext'; // อ้างอิงถึง AuthContext ที่มีอยู่

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const { userData } = useAuth();
  const [permissions, setPermissions] = useState([]);
  
  // โหลดข้อมูลสิทธิ์ของผู้ใช้
  useEffect(() => {
    // สมมติว่าเรามีฟังก์ชันที่ดึงสิทธิ์จาก backend
    // แต่ในขั้นตอนนี้เราจะสร้างสิทธิ์จากบทบาทของผู้ใช้
    if (userData && userData.role) {
      let userPermissions = [];
      
      if (userData.role === 'admin') {
        userPermissions = [
          'admin.dashboard.view',
          'admin.documents.view',
          'admin.documents.approve',
          'admin.documents.reject',
          'admin.users.view',
          'admin.users.edit',
          'admin.reports.view',
          'admin.settings.view',
          'admin.settings.edit',
        ];
      } else if (userData.role === 'teacher') {
        userPermissions = [
          'admin.dashboard.view',
          'admin.documents.view',
          'admin.documents.approve',
          'admin.documents.reject',
        ];
      }
      
      setPermissions(userPermissions);
    }
  }, [userData]);
  
  // ฟังก์ชันตรวจสอบสิทธิ์
  const hasPermission = (permissionName) => {
    return permissions.includes(permissionName);
  };
  
  const value = {
    permissions,
    hasPermission,
  };
  
  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystemContext = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemContext must be used within a SystemProvider');
  }
  return context;
};