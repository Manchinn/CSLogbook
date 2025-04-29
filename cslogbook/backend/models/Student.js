const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Student extends Model {
        static associate(models) {
            Student.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
            Student.belongsTo(models.Teacher, {
                foreignKey: 'advisorId',
                as: 'advisor'
            });
            Student.hasMany(models.ProjectMember, {
                foreignKey: 'studentId',
                as: 'projectMemberships'
            });
            Student.hasMany(models.InternshipDocument, {
                foreignKey: 'studentId',
                as: 'internshipDocuments'
            });
            Student.hasMany(models.ProjectDocument, {
                foreignKey: 'studentId',
                as: 'projectDocuments'
            });
            Student.hasMany(models.Document, {
                foreignKey: 'userId',
                sourceKey: 'userId',
                as: 'documents'
            });
            Student.hasMany(models.TimelineStep, {
                foreignKey: 'student_id',
                as: 'timelineSteps'
            });
            Student.hasMany(models.StudentProgress, {
                foreignKey: 'student_id',
                as: 'progressData'
            });
        }
        
        // เพิ่ม method สำหรับตรวจสอบสิทธิ์ฝึกงาน
        async checkInternshipEligibility() {
            try {
                const Academic = sequelize.models.Academic;
                const Curriculum = sequelize.models.Curriculum;
                
                // ดึงการตั้งค่าปีการศึกษาล่าสุด
                const academicSettings = await Academic.findOne({
                    order: [['created_at', 'DESC']] // ดึงรายการล่าสุดแทนการใช้ isActive
                });
                
                // กำหนดค่า default หากไม่พบการตั้งค่าปีการศึกษา
                const currentSemester = academicSettings?.currentSemester || 1;
                let allowedSemesters = [3]; // ค่า default สำหรับฝึกงาน
                
                // หากมี academicSettings ให้อ่านค่า internshipSemesters
                if (academicSettings?.internshipSemesters) {
                    // หากข้อมูลเป็น JSON string ให้แปลงเป็น array
                    if (typeof academicSettings.internshipSemesters === 'string') {
                        try {
                            allowedSemesters = JSON.parse(academicSettings.internshipSemesters);
                        } catch (e) {
                            // ใช้ค่า default หากแปลงไม่ได้
                        }
                    } else if (Array.isArray(academicSettings.internshipSemesters)) {
                        allowedSemesters = academicSettings.internshipSemesters;
                    }
                }
                
                // ดึงข้อมูลหลักสูตรที่ใช้งาน
                let curriculum = null;
                if (academicSettings?.activeCurriculumId) {
                    curriculum = await Curriculum.findOne({
                        where: { 
                            curriculumId: academicSettings.activeCurriculumId,
                            active: true 
                        }
                    });
                }
                
                // หากไม่พบหลักสูตร ให้ใช้ค่า default
                const defaultCredits = {
                    internshipBaseCredits: 81,
                    internshipMajorBaseCredits: 0,
                    projectBaseCredits: 95,
                    projectMajorBaseCredits: 47,
                    requireInternshipBeforeProject: false
                };
                
                // ตรวจสอบเงื่อนไขหน่วยกิต โดยใช้ค่า default หากไม่พบหลักสูตร
                const hasEnoughCredits = 
                    this.totalCredits >= (curriculum?.internshipBaseCredits || defaultCredits.internshipBaseCredits) && 
                    this.majorCredits >= (curriculum?.internshipMajorBaseCredits || defaultCredits.internshipMajorBaseCredits);
                
                // ถ้าหน่วยกิตไม่พอ ไม่มีสิทธิ์ทั้งเข้าถึง feature และลงทะเบียน
                if (!hasEnoughCredits) {
                    return {
                        eligible: false,
                        reason: `หน่วยกิตไม่เพียงพอ (${this.totalCredits}/${this.majorCredits} จากเกณฑ์ ${curriculum?.internshipBaseCredits || defaultCredits.internshipBaseCredits}/${curriculum?.internshipMajorBaseCredits || defaultCredits.internshipMajorBaseCredits})`,
                        canAccessFeature: false,
                        canRegister: false
                    };
                }
                
                // ถ้าหน่วยกิตพอ สามารถเข้าถึง feature ได้
                // แต่ต้องตรวจสอบเงื่อนไขอื่นก่อนลงทะเบียน
                
                // ตรวจสอบภาคเรียนที่เปิดให้ลงทะเบียน
                if (!allowedSemesters.includes(currentSemester)) {
                    return {
                        eligible: false,
                        reason: 'ไม่อยู่ในภาคเรียนที่อนุญาตให้ลงทะเบียนฝึกงาน',
                        canAccessFeature: true,  // สามารถเข้า feature ได้เพราะมีหน่วยกิตถึง
                        canRegister: false       // แต่ลงทะเบียนไม่ได้เพราะไม่ใช่ภาคเรียนที่เปิดให้ลงทะเบียน
                    };
                }
                
                // ตรวจสอบช่วงเวลาลงทะเบียน
                const now = new Date();
                let regPeriod = academicSettings?.internshipRegistration;
                
                // หากข้อมูลเป็น JSON string ให้แปลงเป็น object
                if (typeof regPeriod === 'string') {
                    try {
                        regPeriod = JSON.parse(regPeriod);
                    } catch (e) {
                        regPeriod = null;
                    }
                }
                
                const regStart = regPeriod?.startDate ? new Date(regPeriod.startDate) : null;
                const regEnd = regPeriod?.endDate ? new Date(regPeriod.endDate) : null;
                
                // ถ้ามีการกำหนดช่วงเวลาลงทะเบียน ให้ตรวจสอบด้วย
                if (regStart && regEnd && (now < regStart || now > regEnd)) {
                    return {
                        eligible: false,
                        reason: 'ไม่อยู่ในช่วงเวลาลงทะเบียนฝึกงาน',
                        canAccessFeature: true,  // สามารถเข้า feature ได้
                        canRegister: false       // แต่ลงทะเบียนไม่ได้เพราะไม่อยู่ในช่วงเวลาลงทะเบียน
                    };
                }
                
                // ผ่านเงื่อนไขทั้งหมด
                return { 
                    eligible: true,
                    canAccessFeature: true,
                    canRegister: true 
                };
                
            } catch (error) {
                console.error('Error checking internship eligibility:', error);
                return { 
                    eligible: false, 
                    reason: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
                    canAccessFeature: true, // แก้ไขให้เข้าถึง feature ได้แม้มีข้อผิดพลาด
                    canRegister: false
                };
            }
        }
        
        // เพิ่ม method สำหรับตรวจสอบสิทธิ์โครงงานพิเศษ
        async checkProjectEligibility() {
            try {
                const Academic = sequelize.models.Academic;
                const Curriculum = sequelize.models.Curriculum;
                
                // ดึงการตั้งค่าปีการศึกษาล่าสุด
                const academicSettings = await Academic.findOne({
                    order: [['created_at', 'DESC']] // ดึงรายการล่าสุดแทนการใช้ isActive
                });
                
                // กำหนดค่า default หากไม่พบการตั้งค่าปีการศึกษา
                const currentSemester = academicSettings?.currentSemester || 1;
                let allowedSemesters = [1, 2]; // ค่า default สำหรับโครงงาน
                
                // หากมี academicSettings ให้อ่านค่า projectSemesters
                if (academicSettings?.projectSemesters) {
                    // หากข้อมูลเป็น JSON string ให้แปลงเป็น array
                    if (typeof academicSettings.projectSemesters === 'string') {
                        try {
                            allowedSemesters = JSON.parse(academicSettings.projectSemesters);
                        } catch (e) {
                            // ใช้ค่า default หากแปลงไม่ได้
                        }
                    } else if (Array.isArray(academicSettings.projectSemesters)) {
                        allowedSemesters = academicSettings.projectSemesters;
                    }
                }
                
                // ดึงข้อมูลหลักสูตรที่ใช้งาน
                let curriculum = null;
                if (academicSettings?.activeCurriculumId) {
                    curriculum = await Curriculum.findOne({
                        where: { 
                            curriculumId: academicSettings.activeCurriculumId,
                            active: true 
                        }
                    });
                }
                
                // หากไม่พบหลักสูตร ให้ใช้ค่า default
                const defaultCredits = {
                    internshipBaseCredits: 81,
                    internshipMajorBaseCredits: 0,
                    projectBaseCredits: 95,
                    projectMajorBaseCredits: 47,
                    requireInternshipBeforeProject: false
                };
                
                // ตรวจสอบเงื่อนไขหน่วยกิต โดยใช้ค่า default หากไม่พบหลักสูตร
                const hasEnoughCredits = 
                    this.totalCredits >= (curriculum?.projectBaseCredits || defaultCredits.projectBaseCredits) && 
                    this.majorCredits >= (curriculum?.projectMajorBaseCredits || defaultCredits.projectMajorBaseCredits);
                
                // ถ้าหน่วยกิตไม่พอ ไม่มีสิทธิ์ทั้งเข้าถึง feature และลงทะเบียน
                if (!hasEnoughCredits) {
                    return {
                        eligible: false,
                        reason: `หน่วยกิตไม่เพียงพอ (${this.totalCredits}/${this.majorCredits} จากเกณฑ์ ${curriculum?.projectBaseCredits || defaultCredits.projectBaseCredits}/${curriculum?.projectMajorBaseCredits || defaultCredits.projectMajorBaseCredits})`,
                        canAccessFeature: false,
                        canRegister: false
                    };
                }
                
                // ตรวจสอบเงื่อนไขว่าต้องผ่านฝึกงานหรือไม่
                const requireInternship = curriculum?.requireInternshipBeforeProject || defaultCredits.requireInternshipBeforeProject;
                if (requireInternship) {
                    // ตรวจสอบประวัติการฝึกงาน
                    const InternshipDocument = sequelize.models.InternshipDocument;
                    const completedInternship = await InternshipDocument.findOne({
                        where: {
                            studentId: this.studentId,
                            status: 'completed'
                        }
                    });
                    
                    if (!completedInternship) {
                        return {
                            eligible: false,
                            reason: 'ต้องผ่านการฝึกงานก่อนจึงจะสามารถลงทะเบียนโครงงานพิเศษได้',
                            canAccessFeature: false,  // ไม่สามารถเข้าถึง feature ได้เพราะยังไม่ผ่านฝึกงาน
                            canRegister: false
                        };
                    }
                }
                
                // ถ้าหน่วยกิตพอและผ่านเงื่อนไขฝึกงาน (ถ้ามี) สามารถเข้าถึง feature ได้
                // แต่ต้องตรวจสอบเงื่อนไขอื่นก่อนลงทะเบียน
                
                // ตรวจสอบภาคเรียนที่เปิดให้ลงทะเบียน
                if (!allowedSemesters.includes(currentSemester)) {
                    return {
                        eligible: false,
                        reason: 'ไม่อยู่ในภาคเรียนที่อนุญาตให้ลงทะเบียนโครงงานพิเศษ',
                        canAccessFeature: true,  // สามารถเข้า feature ได้เพราะมีหน่วยกิตถึง
                        canRegister: false       // แต่ลงทะเบียนไม่ได้เพราะไม่ใช่ภาคเรียนที่เปิดให้ลงทะเบียน
                    };
                }
                
                // ตรวจสอบช่วงเวลาลงทะเบียน
                const now = new Date();
                let regPeriod = academicSettings?.projectRegistration;
                
                // หากข้อมูลเป็น JSON string ให้แปลงเป็น object
                if (typeof regPeriod === 'string') {
                    try {
                        regPeriod = JSON.parse(regPeriod);
                    } catch (e) {
                        regPeriod = null;
                    }
                }
                
                const regStart = regPeriod?.startDate ? new Date(regPeriod.startDate) : null;
                const regEnd = regPeriod?.endDate ? new Date(regPeriod.endDate) : null;
                
                // ถ้ามีการกำหนดช่วงเวลาลงทะเบียน ให้ตรวจสอบด้วย
                if (regStart && regEnd && (now < regStart || now > regEnd)) {
                    return {
                        eligible: false,
                        reason: 'ไม่อยู่ในช่วงเวลาลงทะเบียนโครงงานพิเศษ',
                        canAccessFeature: true,  // สามารถเข้า feature ได้
                        canRegister: false       // แต่ลงทะเบียนไม่ได้เพราะไม่อยู่ในช่วงเวลาลงทะเบียน
                    };
                }
                
                // ผ่านเงื่อนไขทั้งหมด
                return { 
                    eligible: true,
                    canAccessFeature: true,
                    canRegister: true
                };
                
            } catch (error) {
                console.error('Error checking project eligibility:', error);
                return { 
                    eligible: false, 
                    reason: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
                    canAccessFeature: true, // แก้ไขให้เข้าถึง feature ได้แม้มีข้อผิดพลาด
                    canRegister: false  
                };
            }
        }
    }

    Student.init({
        studentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'student_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        studentCode: {
            type: DataTypes.STRING(13),
            allowNull: false,
            unique: true,
            field: 'student_code'
        },
        totalCredits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_credits'
        },
        majorCredits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'major_credits'
        },
        gpa: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        studyType: {
            type: DataTypes.ENUM('regular', 'special'),
            allowNull: false,
            defaultValue: 'regular',
            field: 'study_type'
        },
        isEligibleInternship: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_eligible_internship'
        },
        isEligibleProject: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_eligible_project'
        },
        advisorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'advisor_id'
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 3
            }
        },
        academicYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'academic_year',
            defaultValue: () => {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear() + 543;
                const currentMonth = currentDate.getMonth() + 1;
                return currentMonth > 4 ? currentYear : currentYear - 1;
            }
        },
        studentYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            field: 'student_year',
            validate: {
                min: 1,
                max: 8
            }
        }
    }, {
        sequelize,
        modelName: 'Student',
        tableName: 'students',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_student_advisor',
                fields: ['advisor_id']
            },
            {
                unique: true,
                name: 'idx_student_code',
                fields: ['student_code']
            },
            {
                name: 'idx_academic_year',
                fields: ['academic_year']
            }
        ]
    });

    return Student;
};
