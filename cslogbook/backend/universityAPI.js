const universityAPIData = [
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
    },/*
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
  
  // Function to simulate fetching student data from the university API
  function getUniversityData(studentID) {
    return universityAPIData.find(student => student.studentID === studentID) || null;
  }

  function authenticateUser(username, password) {
    return universityAPIData.find(user => user.username === username && user.password === password) || null;
  }
  
  module.exports = { getUniversityData, authenticateUser };
  