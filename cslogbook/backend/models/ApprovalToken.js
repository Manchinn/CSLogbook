'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ApprovalToken extends Model {        static associate(models) {
            // สร้างความสัมพันธ์กับโมเดล InternshipLogbook
            this.belongsTo(models.InternshipLogbook, {
                foreignKey: 'log_id', // ใช้ property name ในโมเดล ApprovalToken
                as: 'logbook'
            });
              // สร้างความสัมพันธ์กับโมเดล Student
            this.belongsTo(models.Student, {
                foreignKey: 'student_id', // ใช้ property name ในโมเดล ApprovalToken
                targetKey: 'studentCode', // target ที่ field studentCode ในตาราง students 
                as: 'student'
            });

            // Add association to Document model
            this.belongsTo(models.Document, {
                foreignKey: 'document_id',
                targetKey: 'documentId', // Assuming Document model has documentId as primary key
                as: 'document'
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
        email: { // Add this email field
            type: DataTypes.STRING,
            allowNull: true, // Or false if email is always required for a token
            validate: {
                isEmail: true
            }
        },
        // Link to the Document table
        documentId: { 
            type: DataTypes.INTEGER,
            allowNull: true, // Or false if a token MUST be linked to a document
            field: 'document_id',
            references: {
                model: 'documents', // Name of the target table
                key: 'document_id',   // Name of the target column
            }
        },
        logId: {
            type: DataTypes.STRING(255), // เก็บเป็น string เพราะอาจมีหลาย logId คั่นด้วย comma
            allowNull: true,
            field: 'log_id'
        },
        supervisorId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'supervisor_id'
        },
        studentId: {
            type: DataTypes.STRING(20), // รหัสนักศึกษา
            allowNull: false,
            field: 'student_id'
        },
        type: {
            type: DataTypes.ENUM('single', 'weekly', 'monthly', 'full', 'supervisor_evaluation'), // Added 'supervisor_evaluation'
            defaultValue: 'single',
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'used'), // Added 'used'
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