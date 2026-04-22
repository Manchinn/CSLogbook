const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Signatory extends Model {
        static associate(models) {
            Signatory.hasMany(models.Document, {
                foreignKey: 'signatory_id',
                as: 'documents'
            });
        }
    }

    Signatory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id'
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        signatureUrl: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'signature_url'
        },
        role: {
            type: DataTypes.ENUM('PRIMARY', 'DEPUTY', 'ACTING'),
            allowNull: false,
            defaultValue: 'PRIMARY'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active'
        }
    }, {
        sequelize,
        modelName: 'Signatory',
        tableName: 'signatories',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Signatory;
};
