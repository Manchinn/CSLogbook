const { Model } = require('sequelize'); // DataTypes will be passed by the caller (index.js)
// These require statements are for the 'references' in init.
// They assume ApprovalToken, InternshipDocument, Student export their classes directly
// or are already loaded. If this causes issues, string model names in 'references'
// might be more robust (e.g., model: 'ApprovalTokens').
const ApprovalToken = require('./ApprovalToken');
const InternshipDocument = require('./InternshipDocument');
const Student = require('./Student');

module.exports = (sequelize, DataTypes) => {
  class InternshipEvaluation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      InternshipEvaluation.belongsTo(models.ApprovalToken, { foreignKey: 'approvalTokenId', as: 'approvalToken' });
      // The corresponding ApprovalToken.hasOne(InternshipEvaluation, ...) should be in ApprovalToken.js's associate method

      InternshipEvaluation.belongsTo(models.InternshipDocument, { foreignKey: 'internshipId', as: 'internshipDocument' });
      // The corresponding InternshipDocument.hasMany(InternshipEvaluation, ...) should be in InternshipDocument.js's associate method

      InternshipEvaluation.belongsTo(models.Student, { foreignKey: 'studentId', as: 'student' });
      // The corresponding Student.hasMany(InternshipEvaluation, ...) should be in Student.js's associate method
    }
  }

  InternshipEvaluation.init({
    evaluationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: 'evaluation_id'
    },
    approvalTokenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approval_token_id',
      references: {
        model: ApprovalToken, // Or use string 'ApprovalTokens' if direct require is problematic
        key: 'token_id'
      }
    },
    internshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'internship_id',
      references: {
        model: InternshipDocument, // Or use string 'InternshipDocuments'
        key: 'internship_id'
      }
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
      references: {
        model: Student, // Or use string 'Students'
        key: 'student_id'
      }
    },
    evaluatorName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'evaluator_name'
    },
    evaluationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'evaluation_date'
    },
    q1Knowledge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q1_knowledge'
    },
    q2Responsibility: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q2_responsibility'
    },
    q3Initiative: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q3_initiative'
    },
    q4Adaptability: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q4_adaptability'
    },
    q5ProblemSolving: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q5_problem_solving'
    },
    q6Communication: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q6_communication'
    },
    q7Punctuality: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q7_punctuality'
    },
    q8Personality: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'q8_personality'
    },
    overallScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'overall_score'
    },
    strengths: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    weaknessesToImprove: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'weaknesses_to_improve'
    },
    additionalComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'additional_comments'
    },
    overallGrade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'overall_grade'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'submitted_by_supervisor',
    },
    evaluatedBySupervisorAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'evaluated_by_supervisor_at'
    }
  }, {
    sequelize, // Use the sequelize instance passed by index.js
    modelName: 'InternshipEvaluation',
    tableName: 'internship_evaluations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return InternshipEvaluation;
};
