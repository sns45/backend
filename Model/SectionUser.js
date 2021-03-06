module.exports = function(sequelize, DataTypes) {
    return sequelize.define('SectionUser', {
        SectionUserID: {
            //Unique ID for this composite.
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'SectionUserID',
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        SectionID: {
            //Unique identified for the section
            //Foreign Key
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'SectionID',
            allowNull: false
        },
        UserID: {
            //Unique identifier for the user
            //Foreign Key
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'UserID',
            allowNull: false
        },
        Role: {
            //Role of the user in the course on the respective semester
            type: DataTypes.STRING(30),
            field: 'Role',
            allowNull: false,
            defaultValue: 'Student',
            validate: {
                isIn: [
                    ['Student', 'Instructor', 'Observer']
                ]
            }
        },
        Active: {
            type: DataTypes.BOOLEAN,
            field: 'Active',
            allowNull: false,
            defaultValue: true
        },
        Volunteer: {
            type: DataTypes.BOOLEAN,
            field: 'Volunteer',
            allowNull: false,
            defaultValue: false
        }
    }, {
        timestamps: false,

        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        paranoid: true,

        // don't use camelcase for automatically added attributes but underscore style
        // so updatedAt will be updated_at
        underscored: true,

        // disable the modification of table names; By default, sequelize will automatically
        // transform all passed model names (first parameter of define) into plural.
        // if you don't want that, set the following
        freezeTableName: true,

        // define the table's name
        tableName: 'sectionuser'
    });
};
