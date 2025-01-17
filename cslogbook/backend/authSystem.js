// const pool = require('./config/database'); // เชื่อมต่อฐานข้อมูล

// // ฟังก์ชันตรวจสอบสิทธิ์ในฐานข้อมูล
// async function checkEligibility(studentID) {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT isEligibleForInternship, isEligibleForProject
//       FROM student_data
//       WHERE studentID = ?
//     `, [studentID]);

//     if (rows.length > 0) {
//       return {
//         isEligibleForInternship: rows[0].isEligibleForInternship,
//         isEligibleForProject: rows[0].isEligibleForProject
//       };
//     }
//     return null; // ถ้าไม่พบข้อมูล
//   } catch (error) {
//     console.error('Error in checkEligibility:', error);
//     throw new Error('Database error while checking eligibility');
//   }
// }

// module.exports = { checkEligibility };
