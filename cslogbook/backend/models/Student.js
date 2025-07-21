const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Student extends Model {
        static associate(models) {
            Student.belongsTo(models.User, {
                foreignKey: 'user_id',
                targetKey: 'userId',
                as: 'user'
            });
            Student.belongsTo(models.Teacher, {
                foreignKey: 'advisor_id',
                targetKey: 'teacherId',
                as: 'advisor'
            });
            Student.belongsTo(models.Curriculum, {
                foreignKey: 'curriculum_id',
                targetKey: 'curriculumId',
                as: 'studentCurriculum'
            });
            Student.hasMany(models.ProjectMember, {
                foreignKey: 'student_id',
                as: 'projectMemberships'
            });
            // Student.hasMany(models.InternshipDocument, {
            //     foreignKey: \'studentId\',
            //     as: \'internshipDocuments\'
            // });
            Student.hasMany(models.ProjectDocument, {
                foreignKey: 'student_id',
                as: 'projectDocuments'
            });
            Student.hasMany(models.Document, {
                foreignKey: 'user_id',
                sourceKey: 'user_id',
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
            Student.hasMany(models.StudentWorkflowActivity, {
                foreignKey: 'student_id',
                as: 'workflowActivities'
            });
        }

        async checkInternshipEligibility() {
            try {
                const Academic = sequelize.models.Academic;

                const studentSpecificCurriculum = await this.getStudentCurriculum();

                let requiredTotalCredits;
                let requiredMajorCreditsForInternship;
                let curriculumName = "ไม่พบข้อมูลหลักสูตร";

                if (studentSpecificCurriculum) {
                    requiredTotalCredits = studentSpecificCurriculum.internshipBaseCredits;
                    requiredMajorCreditsForInternship = studentSpecificCurriculum.internshipMajorBaseCredits;
                    curriculumName = studentSpecificCurriculum.name;
                    console.log(`Student.js: Internship Eligibility - Using student's assigned curriculum`, {
                        studentCode: this.studentCode,
                        curriculumName: curriculumName,
                        curriculumId: studentSpecificCurriculum.curriculumId
                    });
                } else {
                    // กรณีไม่พบ Curriculum ที่ผูกกับนักศึกษา
                    console.warn(`Student.js: ไม่พบ Curriculum ที่ผูกกับนักศึกษา ${this.studentCode}. กำลังพยายามใช้ Active Curriculum ของระบบ.`);

                    // 1. ดึง Academic record ล่าสุด (เพื่อหา active curriculum id)
                    const academicSettingsFallback = await Academic.findOne({ order: [['created_at', 'DESC']] });

                    // 2. ตรวจสอบว่ามี activeCurriculumId หรือไม่
                    if (academicSettingsFallback?.activeCurriculumId) {
                        // 3. ดึง Curriculum ที่ active ตาม id ที่ได้จาก Academic
                        const activeSystemCurriculum = await sequelize.models.Curriculum.findOne({
                            where: { curriculumId: academicSettingsFallback.activeCurriculumId, active: true }
                        });

                        // 4. ถ้าพบ curriculum ที่ active
                        if (activeSystemCurriculum) {
                            requiredTotalCredits = activeSystemCurriculum.internshipBaseCredits;
                            requiredMajorCreditsForInternship = activeSystemCurriculum.internshipMajorBaseCredits;
                            curriculumName = `(Fallback) ${activeSystemCurriculum.name}`;
                            console.log(`Student.js: Fallback to Active System Curriculum: ${curriculumName} (ID: ${activeSystemCurriculum.curriculumId})`);
                        } else {
                            // 5. ไม่พบ curriculum ที่ active ตาม id ที่ได้
                            console.error(`Student.js: ไม่พบ Curriculum ที่ active ตาม activeCurriculumId (${academicSettingsFallback.activeCurriculumId}) ในระบบ`);
                        }
                    } else {
                        // 6. ไม่พบค่า activeCurriculumId ใน Academic record
                        console.error('Student.js: ไม่พบค่า activeCurriculumId ใน Academic record');
                    }
                }

                if (requiredTotalCredits === undefined || requiredTotalCredits === null) {
                    console.error('Student.js: ไม่สามารถกำหนดเกณฑ์หน่วยกิตรวมสำหรับการฝึกงานได้');
                    return { eligible: false, reason: 'ระบบไม่สามารถกำหนดเกณฑ์หน่วยกิตฝึกงานได้', canAccessFeature: false, canRegister: false };
                }

                console.log('Student.js - checkInternshipEligibility (using specific/fallback curriculum):', {
                    studentTotalCredits: this.totalCredits,
                    requiredTotalCredits: requiredTotalCredits,
                    studentMajorCredits: this.majorCredits,
                    requiredMajorCreditsForInternship: requiredMajorCreditsForInternship,
                });

                if (this.totalCredits < requiredTotalCredits) {
                    return {
                        eligible: false,
                        reason: `หน่วยกิตรวมไม่เพียงพอ (มี ${this.totalCredits} จากเกณฑ์ ${requiredTotalCredits} ของหลักสูตร: ${curriculumName})`,
                        canAccessFeature: false,
                        canRegister: false
                    };
                }

                if (requiredMajorCreditsForInternship !== undefined && requiredMajorCreditsForInternship !== null) {
                    if (this.majorCredits < requiredMajorCreditsForInternship) {
                        return {
                            eligible: false,
                            reason: `หน่วยกิตวิชาเอกไม่เพียงพอ (มี ${this.majorCredits} จากเกณฑ์ ${requiredMajorCreditsForInternship} ของหลักสูตร: ${curriculumName})`,
                            canAccessFeature: false,
                            canRegister: false
                        };
                    }
                }

                console.log('Student.js - Passed INTERNSHIP credit checks.');
                return {
                    eligible: true,
                    reason: `ผ่านเกณฑ์หน่วยกิต (หลักสูตร: ${curriculumName})`,
                };

            } catch (error) {
                console.error('Error in Student.checkInternshipEligibility:', error);
                return {
                    eligible: false,
                    reason: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ฝึกงาน (Student.js)',
                };
            }
        }

        async checkProjectEligibility() {
            try {
                const Academic = sequelize.models.Academic;

                const studentSpecificCurriculum = await this.getStudentCurriculum();

                let requiredTotalCredits;
                let requiredMajorCredits;
                let curriculumName = "ไม่พบข้อมูลหลักสูตร";
                let requiresInternshipCompletion = false;

                if (studentSpecificCurriculum) {
                    requiredTotalCredits = studentSpecificCurriculum.projectBaseCredits;
                    requiredMajorCredits = studentSpecificCurriculum.projectMajorBaseCredits;
                    requiresInternshipCompletion = studentSpecificCurriculum.requireInternshipBeforeProject;
                    curriculumName = studentSpecificCurriculum.name;
                    console.log(`Student.js: Project eligibility for student ${this.studentCode}, Curriculum: ${curriculumName} (ID: ${studentSpecificCurriculum.curriculumId})`);
                } else {
                    console.warn(`Student.js: ไม่พบ Curriculum ที่ผูกกับนักศึกษา ${this.studentCode} สำหรับโครงงาน. กำลังพยายามใช้ Active Curriculum ของระบบ.`);
                    const academicSettingsFallback = await Academic.findOne({ order: [['created_at', 'DESC']] });
                    if (academicSettingsFallback?.activeCurriculumId) {
                        const activeSystemCurriculum = await sequelize.models.Curriculum.findOne({
                            where: { curriculumId: academicSettingsFallback.activeCurriculumId, active: true }
                        });
                        if (activeSystemCurriculum) {
                            requiredTotalCredits = activeSystemCurriculum.projectBaseCredits;
                            requiredMajorCredits = activeSystemCurriculum.projectMajorBaseCredits;
                            requiresInternshipCompletion = activeSystemCurriculum.requireInternshipBeforeProject;
                            curriculumName = `(Fallback) ${activeSystemCurriculum.name}`;
                            console.log(`Student.js: Fallback to Active System Curriculum for Project: ${curriculumName} (ID: ${activeSystemCurriculum.curriculumId})`);
                        }
                    }
                }

                if (requiredTotalCredits === undefined || requiredTotalCredits === null) {
                    console.error('Student.js: ไม่สามารถกำหนดเกณฑ์หน่วยกิตรวมสำหรับโครงงานได้');
                    return { eligible: false, reason: 'ระบบไม่สามารถกำหนดเกณฑ์หน่วยกิตโครงงานได้' };
                }
                if (requiredMajorCredits === undefined || requiredMajorCredits === null) {
                    console.warn('Student.js: ไม่ได้กำหนดเกณฑ์หน่วยกิตวิชาเอกสำหรับโครงงานในหลักสูตรนี้ จะไม่นำมาพิจารณา');
                }

                console.log('Student.js - checkProjectEligibility (using specific/fallback curriculum):', {
                    studentTotalCredits: this.totalCredits,
                    requiredTotalCredits: requiredTotalCredits,
                    studentMajorCredits: this.majorCredits,
                    requiredMajorCredits: requiredMajorCredits,
                });

                if (this.totalCredits < requiredTotalCredits) {
                    return {
                        eligible: false,
                        reason: `หน่วยกิตรวมไม่เพียงพอสำหรับโครงงาน (มี ${this.totalCredits} จากเกณฑ์ ${requiredTotalCredits} ของหลักสูตร: ${curriculumName})`,
                    };
                }

                if (requiredMajorCredits !== undefined && requiredMajorCredits !== null) {
                    if (this.majorCredits < requiredMajorCredits) {
                        return {
                            eligible: false,
                            reason: `หน่วยกิตวิชาเอกไม่เพียงพอสำหรับโครงงาน (มี ${this.majorCredits} จากเกณฑ์ ${requiredMajorCredits} ของหลักสูตร: ${curriculumName})`,
                        };
                    }
                }

                if (requiresInternshipCompletion) {
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
                        };
                    }
                }

                console.log('Student.js - Passed PROJECT credit checks.');
                return {
                    eligible: true,
                    reason: `ผ่านเกณฑ์หน่วยกิตโครงงาน (หลักสูตร: ${curriculumName})`,
                };

            } catch (error) {
                console.error('Error in Student.checkProjectEligibility:', error);
                return {
                    eligible: false,
                    reason: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์โครงงาน (Student.js)',
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
        curriculumId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'curriculum_id',
            references: {
                model: 'curriculums',
                key: 'curriculum_id'
            }
        },
        studentCode: {
            type: DataTypes.STRING(13),
            allowNull: false,
            unique: true,
            field: 'student_code'
        },
        classroom: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'ห้องเรียน (RA, RB, RC, DA, DB, CSB)'
        },
        phoneNumber: {
            type: DataTypes.STRING(15),
            allowNull: true,
            field: 'phone_number',
            comment: 'เบอร์โทรศัพท์นักศึกษา'
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
        },
        internshipStatus: {
            type: DataTypes.ENUM('not_started', 'pending_approval', 'in_progress', 'completed'),
            defaultValue: 'not_started',
            field: 'internship_status'
        },
        projectStatus: {
            type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
            defaultValue: 'not_started',
            field: 'project_status'
        },
        isEnrolledInternship: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_enrolled_internship'
        },
        isEnrolledProject: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_enrolled_project'
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
            },
            {
                name: 'idx_student_curriculum',
                fields: ['curriculum_id']
            },
            {
                name: 'idx_student_classroom',
                fields: ['classroom']
            }
        ]
    });

    return Student;
};
