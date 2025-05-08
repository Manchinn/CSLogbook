'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ApprovalToken extends Model {
        static associate(models) {
            // สร้างความสัมพันธ์กับโมเดล InternshipLogbook
            this.belongsTo(models.InternshipLogbook, {
                foreignKey: 'logId',
                as: 'logbook'
            });
            
            // สร้างความสัมพันธ์กับโมเดล Student
            this.belongsTo(models.Student, {
                foreignKey: 'studentId',
                as: 'student'
            });
        }
    }

    ApprovalToken.init({
        tokenId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'token_id'
        },
        token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        logId: {
            type: DataTypes.STRING(255), // เก็บเป็น string เพราะอาจมีหลาย logId คั่นด้วย comma
            allowNull: false,
            field: 'log_id'
        },
        supervisorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'supervisor_id'
        },
        studentId: {
            type: DataTypes.STRING(20), // รหัสนักศึกษา
            allowNull: false,
            field: 'student_id'
        },
        type: {
            type: DataTypes.ENUM('single', 'weekly', 'monthly', 'full'),
            defaultValue: 'single',
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
            allowNull: false
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        sequelize,
        modelName: 'ApprovalToken',
        tableName: 'approval_tokens',
        timestamps: true,
        underscored: true
    });

    return ApprovalToken;
};