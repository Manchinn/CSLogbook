const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
            Teacher.hasMany(models.Student, {
                foreignKey: 'advisor_id',
                as: 'advisedStudents'
            });
            Teacher.hasMany(models.ProjectDocument, {
                foreignKey: 'advisor_id',
                as: 'projectsAsAdvisor'
            });
            Teacher.hasMany(models.ProjectDocument, {
                foreignKey: 'co_advisor_id',
                as: 'projectsAsCoAdvisor'
            });
        }
    }

    Teacher.init({
        teacherId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'teacher_id'
        },
        teacherCode: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
            field: 'teacher_code'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        contactExtension: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'contact_extension'
        },
        teacherType: {
            type: DataTypes.ENUM('academic', 'support'),
            allowNull: false,
            defaultValue: 'academic',
            field: 'teacher_type'
        },
        // เพิ่มฟิลด์ตำแหน่งของอาจารย์ (position)
        position: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'คณาจารย์', // ถ้าไม่ได้ระบุตำแหน่ง จะถือว่าเป็นอาจารย์ทั่วไป
            field: 'position'
        },
        canAccessTopicExam: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'can_access_topic_exam'
        }
    }, {
        sequelize,
        modelName: 'Teacher',
        tableName: 'teachers',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                name: 'idx_teacher_code',
                fields: ['teacher_code']
            },
            {
                name: 'idx_teacher_user',
                fields: ['user_id']
            },
            {
                name: 'idx_teacher_type',
                fields: ['teacher_type']
            }
        ]
    });

    return Teacher;
};
