const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Curriculum extends Model {
        static associate(models) {
            // หากมีความสัมพันธ์กับโมเดลอื่น เช่น Student หรือ Course
            Curriculum.hasMany(models.Student, {
                foreignKey: 'curriculum_id',
                as: 'students'
            });
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