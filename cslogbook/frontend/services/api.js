// // src/services/api.js

// const API_URL = 'http://localhost:5000';

// export const authAPI = {
//   login: async (credentials) => {
//     const response = await fetch(`${API_URL}/auth/login`, {  // แก้ URL
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//       body: JSON.stringify(credentials)
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || 'เข้าสู่ระบบไม่สำเร็จ');
//     }

//     return response.json();
//   }
// };

export const fetchStudentList = async () => {
  const response = await fetch(`${API_URL}/api/students`);
  const data = await response.json();
  return data;
};