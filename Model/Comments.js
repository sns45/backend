module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Comments', {
        CommentsID: {
            //Unique identifier for the user
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'CommentsID',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        UserID: {
            //Unique identifier for the user
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'UserID',
            allowNull: false
        },
<<<<<<< HEAD
        CommentTarget:{
            type: DataTypes.STRING(255),
            field: 'CommentTarget',
            allowNull: true
        },
=======
>>>>>>> 4342169c3e1b1a02020952d66967a709f039d48c
        TargetID: {
            //Unique identifier for the user
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'TargetID',
            allowNull: false
        },
        AssignmentInstanceID: {
            //Unique identifier for assignment instance
            //Foreign Key
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'AssignmentInstanceID',
            allowNull: true
        },
<<<<<<< HEAD
        // TaskInstanceID: {
        //     //Unique identifier for assignment instance
        //     //Foreign Key
        //     type: DataTypes.INTEGER.UNSIGNED,
        //     field: 'TaskInstanceID',
        //     allowNull: true
        // },
=======
        TaskInstanceID: {
            //Unique identifier for assignment instance
            //Foreign Key
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'TaskInstanceID',
            allowNull: true
        },
        Type: {
            type: DataTypes.STRING,
            field: 'Type',
            allowNull: true
        },
>>>>>>> 4342169c3e1b1a02020952d66967a709f039d48c
        CommentsText: {
            type: DataTypes.STRING,
            field: 'CommentsText',
            allowNull: true
        },
        Rating: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Rating',
            allowNull: true
        },
        Flag: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Flag',
            allowNull: true
        },
<<<<<<< HEAD
        Type: {
            type: DataTypes.STRING,
            field: 'Type',
            allowNull: true
        }, 
=======
>>>>>>> 4342169c3e1b1a02020952d66967a709f039d48c
        Status: {
            type: DataTypes.STRING(255),
            field: 'Status',
            allowNull: true
        },
        Label: {
            type: DataTypes.STRING(255),
            field: 'Label',
            allowNull: true
        },
<<<<<<< HEAD
        // Viewed:{
        //     type: DataTypes.INTEGER.UNSIGNED,
        //     field: 'Viewed',
        //     allowNull: true
        // },
=======
        Viewed:{
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Viewed',
            allowNull: true
        },
>>>>>>> 4342169c3e1b1a02020952d66967a709f039d48c
        ReplyLevel: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'ReplyLevel',
            allowNull: true
        },
        Parents: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Parents',
            allowNull: true
        },
        Delete: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Delete',
            allowNull: true
        },
        Hide: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Hide',
            allowNull: true
        },
        HideReason:{
            type: DataTypes.STRING(255),
            field: 'HideReason',
            allowNull: true
        },
        HideType:{
            type: DataTypes.STRING(255),
            field: 'HideType',
            allowNull: true
        },
        Time: {
            // date and time after which user will be allowed to log in
            type: DataTypes.DATE,
            field: 'Time',
            allowNull: true
        },
        Complete : {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Complete',
            allowNull: true
        },
<<<<<<< HEAD
        Edited:{
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Edited',
            allowNull: true
        },
        OriginTaskInstanceID:{
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'OriginalTaskInstanceID',
            allowNull: true
        }
    }, {
=======
        Hide: {
            type: DataTypes.INTEGER.UNSIGNED,
            field: 'Hide',
            allowNull: true
        },
        CommentTarget:{
            type: DataTypes.STRING(255),
            field: 'Hide',
            allowNull: true
        }
    }, {
      /*
      indexes: [
          // Create a unique index
          {
            name: 'uniqueComments',
            unique: true,
            fields: ['UserID','SectionID', 'AssignmentInstanceID']
          }],
*/
>>>>>>> 4342169c3e1b1a02020952d66967a709f039d48c
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
        tableName: 'Comments'
    });
};
