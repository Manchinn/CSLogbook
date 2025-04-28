const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Curriculum extends Model {
        static associate(models) {
            // เพิ่มความสัมพันธ์กับโมเดล Academic
            Curriculum.hasMany(models.Academic, {
                foreignKey: 'active_curriculum_id',
                as: 'usingInAcademics'
            });
            
            // หากมีความสัมพันธ์กับโมเดลอื่น เช่น Student หรือ Course

        }
    }

    Curriculum.init({
        curriculumId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'curriculum_id' // แมปกับคอลัมน์ในฐานข้อมูล

        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        shortName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'short_name' // แมปกับคอลัมน์ในฐานข้อมูล
        },
        startYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'start_year' // แมปกับคอลัมน์ในฐานข้อมูล
        },
        endYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'end_year' // แมปกับคอลัมน์ในฐานข้อมูล
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        maxCredits: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'max_credits'
        },
        totalCredits: {
            type: DataTypes.INTEGER, // ฟิลด์สำหรับหน่วยกิตสะสม
            allowNull: true,
            field: 'total_credits'
        },
        majorCredits: {
            type: DataTypes.INTEGER, // ฟิลด์สำหรับหน่วยกิตแต่ละวิชาภาค
            allowNull: true,
            field: 'major_credits'
        },
        internshipBaseCredits: {
            type: DataTypes.INTEGER, // ฟิลด์สำหรับหน่วยกิตฝึกงาน
            allowNull: true,
            field: 'internship_base_credits'
        },
        projectBaseCredits: {
            type: DataTypes.INTEGER, // ฟิลด์สำหรับหน่วยกิตโครงงาน
            allowNull: true,
            field: 'project_base_credits'
        },
        projectMajorBaseCredits: {
            type: DataTypes.INTEGER, // ฟิลด์สำหรับหน่วยกิตโครงงานภาค
            allowNull: true,
            field: 'project_major_base_credits'
        },
        requirements: {
            type: DataTypes.JSON, // เก็บข้อมูลเกณฑ์ในรูปแบบ JSON
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Curriculum',
        tableName: 'curriculums',
        timestamps: true,
        underscored: true, // ใช้ snake_case สำหรับคอลัมน์ในฐานข้อมูล
    });

    return Curriculum;
};