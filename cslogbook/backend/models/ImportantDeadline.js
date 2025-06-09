const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ImportantDeadline extends Model {
        static associate(models) {
            // ความสัมพันธ์กับโมเดลอื่น (ถ้ามี)
        }
    }

    ImportantDeadline.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        relatedTo: {
            type: DataTypes.ENUM('internship', 'project', 'general'),
            allowNull: false,
            field: 'related_to'
        },
        academicYear: {
            type: DataTypes.STRING(10),
            allowNull: false,
            field: 'academic_year'
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_global'
        }
    }, {
        sequelize,
        modelName: 'ImportantDeadline',
        tableName: 'important_deadlines',
        timestamps: true,
        underscored: true
    });

    return ImportantDeadline;
};