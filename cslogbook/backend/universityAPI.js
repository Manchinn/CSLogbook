let universityAPIData = [
    {
      username: "admin1",
      password: "admin1",
      studentID: "4000000000",
      firstName: "admin1",
      lastName: "admin1",
      email: "admin1@email.kmutnb.ac.th",
      role: "admin"
    },
    {
      username: "student1",
      password: "student1",
      studentID: "4000000000000",
      firstName: "student1",
      lastName: "student1",
      email: "student1@email.kmutnb.ac.th",
      role: "student"
    },
    {
      username: "teacher1",
      password: "teacher1",
      studentID: "6400000000000",
      firstName: "teacher1",
      lastName: "teacher1",
      email: "teacher1@email.kmutnb.ac.th",
      role: "teacher"
    },
    {
      username: "s6404062630295",
      password: "admin",
      studentID: "6404062630295",
      firstName: "ชินกฤต",
      lastName: "ศรีป่าน",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      username: "s6304062616013",
      password: "6304062616013",
      studentID: "6304062616013",
      firstName: "กริน",
      lastName: "นนทจิตต์",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      username: "s6404062610294",
      password: "6404062610294",
      studentID: "6404062610294",
      firstName: "นิวัฒน์",
      lastName: "เสียงใส",
      email: "s6404062610294@email.kmutnb.ac.th",
      role: "student"
    },
    {
      username: "s6604062620158",
      password: "6604062620158",
      studentID: "6604062620158",
      firstName: "นำชัย",
      lastName: "ฮังกาสี",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      username: "s6404062610286",
      password: "6404062610286",
      studentID: "6404062610286",
      firstName: "นพดล",
      lastName: "เกียรติศิริ",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },/*
    {
      studentID: "6404062610324",
      firstName: "พชร",
      lastName: "วรวัตร",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      studentID: "6404062620125",
      firstName: "กัญญาพัชร",
      lastName: "ก้อนนิล",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    }*/
  ];
  
// ฟังก์ชันค้นหาข้อมูลนักศึกษา
const getUniversityData = (studentID) => {
  return universityAPIData.find(student => student.studentID === studentID) || null;
};

const updateUniversityData = (studentData) => {
  try {
      if (!studentData.studentID) {
          console.error('Invalid student ID:', studentData);
          return false;
      }

      // สร้างข้อมูลสำหรับ universityAPIData
      const userData = {
          username: `s${studentData.studentID}`,
          password: studentData.studentID, // รหัสผ่านเริ่มต้นคือรหัสนักศึกษา
          studentID: studentData.studentID,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: `s${studentData.studentID}@email.kmutnb.ac.th`,
          role: studentData.role,
      };

      const existingIndex = universityAPIData.findIndex(
          user => user.studentID === studentData.studentID
      );

      if (existingIndex !== -1) {
          // อัปเดตข้อมูลที่มีอยู่
          universityAPIData[existingIndex] = {
              ...universityAPIData[existingIndex],
              ...userData
          };
          console.log('Updated user login data:', userData);
      } else {
          // เพิ่มข้อมูลใหม่
          universityAPIData.push(userData);
          console.log('Added new user login data:', userData);
      }

      // แสดงข้อมูลทั้งหมดเพื่อตรวจสอบ
      console.log('Current universityAPIData:', universityAPIData);
      return true;
  } catch (error) {
      console.error('Error updating university data:', error);
      return false;
  }
};

// เพิ่ม logging ใน authenticateUser เพื่อตรวจสอบ
const authenticateUser = (username, password) => {
  console.log('Login attempt:', { username, password });
  
  const user = universityAPIData.find(user => {
    if (user && user.username && user.password) {
      console.log('Checking user:', user.username, user.password);
      return user.username === username && user.password === password;
    }
    return false;
  });
  
  console.log('Found user:', user);
  return user || null;
};

// ฟังก์ชันสำหรับตรวจสอบข้อมูลทั้งหมด
const getAllUniversityData = () => {
  console.log('Getting all university data:', universityAPIData);
  return universityAPIData;
};

module.exports = {
  getUniversityData,
  authenticateUser,
  updateUniversityData,
  getAllUniversityData
};
  