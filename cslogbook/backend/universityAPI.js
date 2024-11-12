const universityAPIData = [
    {
      studentID: "6404062630295",
      firstName: "ชินกฤต",
      lastName: "ศรีป่าน",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      studentID: "6304062616013",
      firstName: "กริน",
      lastName: "นนทจิตต์",
      email: "s6304062616013@email.kmutnb.ac.th",
      role: "student"
    },
    {
        studentID: "4000000000",
        firstName: "admin1",
        lastName: "admin1",
        email: "admin1@email.kmutnb.ac.th",
        role: "admin"
      },
      {
        studentID: "6404062630295",
        firstName: "student1",
        lastName: "student1",
        email: "student1@email.kmutnb.ac.th",
        role: "student"
      },
      {
        studentID: "6400000000000",
        firstName: "teacher1",
        lastName: "teacher1",
        email: "teacher1@email.kmutnb.ac.th",
        role: "teacher"
      },
    {
        studentID: "6404062630295",
        firstName: "ชินกฤต",
        lastName: "ศรีป่าน",
        email: "s6404062630295@email.kmutnb.ac.th",
        role: "student"
      },
    {
      studentID: "6304062616013",
      firstName: "กริน",
      lastName: "นนทจิตต์",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
    {
      studentID: "6404062610294",
      firstName: "นิวัฒน์",
      lastName: "เสียงใส",
      email: "s6404062610294@email.kmutnb.ac.th",
      role: "student"
    },
    {
      studentID: "6404062610286",
      firstName: "นพดล",
      lastName: "เกียรติศิริ",
      email: "s6404062630295@email.kmutnb.ac.th",
      role: "student"
    },
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
    }
  ];
  
  // Function to simulate fetching student data from the university API
  function getUniversityData(studentID) {
    return universityAPIData.find(student => student.studentID === studentID) || null;
  }
  
  module.exports = { getUniversityData };
  