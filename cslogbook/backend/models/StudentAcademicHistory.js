const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class StudentAcademicHistory extends Model {
        static associate(models) {
            StudentAcademicHistory.belongsTo(models.Student, {
                foreignKey: 'student_id',
                targetKey: 'studentId',
                as: 'student'
            });
        }
    }

    StudentAcademicHistory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id',
            comment: 'รหัสนักศึกษาที่อ้างอิง'
        },
        academicYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'academic_year',
            comment: 'ปีการศึกษา'
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'semester',
            comment: 'ภาคเรียน (1, 2, 3)'
        },
        status: {
            type: DataTypes.STRING(32),
            allowNull: false,
            comment: 'สถานะ เช่น enrolled, leave, repeat, graduated'
        },
        note: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'หมายเหตุเพิ่มเติม'
        }
    }, {
        sequelize,
        modelName: 'StudentAcademicHistory',
        tableName: 'student_academic_histories',
        timestamps: true,
        underscored: true
    });

    return StudentAcademicHistory;
}; 