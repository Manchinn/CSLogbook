const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class DeadlineWorkflowMapping extends Model {
        static associate(models) {
            DeadlineWorkflowMapping.belongsTo(models.ImportantDeadline, {
                foreignKey: 'important_deadline_id',
                as: 'deadline'
            });
        }
    }

    DeadlineWorkflowMapping.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        importantDeadlineId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'important_deadline_id'
        },
        workflowType: {
            type: DataTypes.ENUM('internship', 'project1', 'project2'),
            allowNull: false,
            field: 'workflow_type'
        },
        stepKey: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'step_key'
        },
        documentSubtype: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'document_subtype',
            comment: 'ประเภทเอกสาร เช่น CS05, acceptance_letter, report, PROJECT1_PROPOSAL, PROJECT1_DEFENSE_REQUEST, THESIS_DEFENSE_REQUEST, PROJECT_SYSTEM_TEST_REQUEST, THESIS_FINAL_REPORT'
        },
        autoAssign: {
            type: DataTypes.ENUM('on_create', 'on_submit', 'on_approve', 'on_generate'),
            allowNull: false,
            defaultValue: 'on_submit',
            field: 'auto_assign'
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'DeadlineWorkflowMapping',
        tableName: 'deadline_workflow_mappings',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['workflow_type', 'step_key', 'document_subtype'],
                name: 'uq_deadline_mapping_combo'
            },
            {
                fields: ['important_deadline_id']
            },
            {
                fields: ['workflow_type']
            }
        ]
    });

    return DeadlineWorkflowMapping;
};
