const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class InternshipLogbookRevision extends Model {
        static associate(models) {
            InternshipLogbookRevision.belongsTo(models.InternshipLogbook, {
                foreignKey: 'log_id',
                as: 'logbook'
            });
            InternshipLogbookRevision.belongsTo(models.User, {
                foreignKey: 'revised_by',
                as: 'revisor'
            });
        }
    }

    InternshipLogbookRevision.init({
        revisionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'revision_id'
        },
        workDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'work_description'
        },
        learningOutcome: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'learning_outcome'
        },
        problems: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        solutions: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        revisionDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'revision_date'
        },
        revisedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'revised_by'
        },
        logId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'log_id'
        }
    }, {
        sequelize,
        modelName: 'InternshipLogbookRevision',
        tableName: 'internship_logbook_revisions',
        timestamps: false,
        indexes: [
            {
                name: 'idx_revision_date',
                fields: ['revision_date']
            },
            {
                name: 'fk_revision_logbook',
                fields: ['log_id']
            },
            {
                name: 'fk_revision_user',
                fields: ['revised_by']
            }
        ]
    });

    return InternshipLogbookRevision;
};
