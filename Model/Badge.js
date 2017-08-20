module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Badge', {
        BadgeID: {
            //Unique identifier for Badge 
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'BadgeID',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
<<<<<<< HEAD
        CategryID: {
            //The Badge Category
            //Foreign Key
=======
        CategoryID: {
>>>>>>> 51e3442b16e737df9b994c0516d0c1a2043fc08f
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'CategoryID',
            allowNull: false
        },
        Name: {
<<<<<<< HEAD
            //Name of the Badge.
=======
>>>>>>> 51e3442b16e737df9b994c0516d0c1a2043fc08f
            type: DataTypes.STRING,
            field: 'Name',
            allowNull: false
        },
        Description: {
            //Description of the Badge
            type: DataTypes.TEXT,
            field: 'Description',
            allowNull: true
<<<<<<< HEAD
=======
        },
        Logo: {
            type: DataTypes.STRING,
            field: 'Logo',
            allowNull: false
>>>>>>> 51e3442b16e737df9b994c0516d0c1a2043fc08f
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
<<<<<<< HEAD
        tableName: 'Badges'
    });
};
=======
        tableName: 'badge'
    });
};
>>>>>>> 51e3442b16e737df9b994c0516d0c1a2043fc08f
