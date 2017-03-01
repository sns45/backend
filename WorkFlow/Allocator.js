var models = require('../Model');
var Promise = require('bluebird');
var moment = require('moment');
var TaskFactory = require('./TaskFactory.js');
var _ = require('underscore');

var User = models.User;
var UserLogin = models.UserLogin;
var UserContact = models.UserContact;
var Course = models.Course;
var Section = models.Section;
var SectionUser = models.SectionUser;
var Semester = models.Semester;
var TaskInstance = models.TaskInstance;
var TaskActivity = models.TaskActivity;
var Assignment = models.Assignment;
var AssignmentInstance = models.AssignmentInstance;
var WorkflowInstance = models.WorkflowInstance;
var WorkflowActivity = models.WorkflowActivity;
var ResetPasswordRequest = models.ResetPasswordRequest;
var EmailNotification = models.EmailNotification;


class Allocator {

    //constructor, give users and one workflow from WorkflowTiming
    constructor(users, userIndex) {
        this.users = users;
        this.workflow = {};
        this.pointer = userIndex;
        this.count = 0;
    }

    getRightUser(ta_id) {
        let x = this;
        let taskUser = []

        return new Promise(function(resolve, reject) {
            return TaskActivity.find({
                where: {
                    TaskActivityID: ta_id
                }
            }).then(function(ta) {

                let constraints = JSON.parse(ta.AssigneeConstraints)[2];

                if (JSON.parse(ta.AssigneeConstraints)[0] === "instructor") {
                    return x.getInstructor(ta_id).then(function(instructor) {
                        taskUser.push(instructor);
                        resolve(taskUser);
                    });
                } else {


                    if (ta.Type === 'needs_consolidation' || ta.Type === 'completed') {
                        if (Object.keys(x.workflow).length < 1) {
                            var same = constraints.same_as[0];
                            console.log('same', same);
                            console.log('workflow', x.workflow);
                            taskUser.push(0);
                        } else {
                            var same = constraints.same_as[0];
                            console.log('same', same);
                            console.log('workflow', x.workflow);
                            taskUser.push(x.workflow[same][0]);
                        }
                    } else if (_.isEmpty(constraints)) {
                        //return the first one in the user list
                        taskUser.push(x.user(ta_id));
                        x.count++;
                    } else if (_.has(constraints, "same_as") && !(_.has(constraints, "not"))) {
                        var same = constraints.same_as[0];
                        console.log('same', same);
                        console.log('workflow', x.workflow);
                        taskUser.push(x.workflow[same][0]);
                    } else if (!(_.has(constraints, "same_as")) && _.has(constraints, "not")) {
                        while (_.contains(constraints.not, x.users[x.count])) {
                            x.count++;
                        }
                        taskUser.push(x.user(ta_id));
                        x.count++;
                    } else if (_.has(constraints, "same_as") && _.has(constraints, "not")) {
                        while (_.contains(constraints.not, x.users[x.count])) {
                            x.count++;
                        }
                        taskUser.push(x.user(ta_id));

                        if (ta.Type === 'grade_problem' && ta.NumberParticipants > 1) {
                            var same = constraints.same_as[0];
                            console.log('same', same);
                            console.log('workflow', x.workflow);
                            taskUser.push(x.workflow[same][0]);
                        }
                        x.count++;
                    }
                }
            }).then(function(done) {
                x.workflow[ta_id] = taskUser;
                resolve(taskUser);
            }).catch(function(err) {
                console.log("Error allocating the users");
                reject(err);
            });
        });
    }

    user(ta_id) {
        let x = this;
        let index = x.pointer + x.count;
        if (index == x.users.length) {
            x.count = 0 - x.pointer;
            index = x.pointer + x.count;
            return x.users[index];
        } else {
            return x.users[index];
        }
    }

    getInstructor(ta_id) {
        return new Promise(function(resolve, reject) {

            return TaskActivity.find({
                where: {
                    TaskActivityID: ta_id
                }
            }).then(function(ta_result) {
                return Assignment.find({
                    where: {
                        AssignmentID: ta_result.AssignmentID
                    }
                }).then(function(assignment) {
                    resolve(assignment.OwnerID);
                });
            }).catch(function(err) {
                console.log('Error retrieving instructor ID');
                console.log(err);
            });
        });
    }


    //-------------------------------------------------------
    // get taskActivityID linked to this task
    getTaskActivityID(task) {



        return new Promise(function(resolve, reject) {

            //console.log('Finding the taskActivityID...');

            var taskActivityID = [];


            TaskInstance.findAll({
                where: {
                    TaskInstanceID: task
                }
            }).then(function(results) {

                //taskActivityID.push(results.TaskActivityID);
                results.forEach(function(task) {
                    //tasks.push(task.TaskActivityID);
                    taskActivityID.push(task.TaskActivityID);
                }, this);

                //console.log('taskActivityID was found!');

                resolve(taskActivityID);

            }).catch(function(err) {
                console.log('Find taskActivityID failed!');
                console.log(err);
            });

        });

    }

    // get AssigneeConstraints linked to this taskActivityID
    getConstraints(ta_id) {

        return new Promise(function(resolve, reject) {
            var constraints;
            return TaskActivity.find({
                where: {
                    TaskActivityID: ta_id
                }
            }).then(function(result) {
                constraints = JSON.parse(result.AssigneeConstraints);
                //console.log(constraints);
                //console.log('All constraints were saved!');

                resolve(constraints);
            }).catch(function(err) {
                console.log('Find constraints failed!');
                reject(err);
            });
        });
    }

    //get user that will be removed from workflow instance
    getLateUser(task) {

        return new Promise(function(resolve, reject) {
            //console.log('Finding the late user...');
            var lateUser;
            TaskInstance.findAll({
                where: {
                    TaskInstanceID: task
                }
            }).then(function(results) {

                results.forEach(function(task) {
                    lateUser = task.UserID;
                }, this);
                //console.log('lateUser was found!');
                resolve(lateUser);
            }).catch(function(err) {
                console.log('Find workflowInstanceID failed!');
                console.log(err);
            });
        });
    }





    // get workflowInstanceID linked to this task
    getWorkflowInstanceID(task) {


        return new Promise(function(resolve, reject) {

            //console.log('Finding the workflowInstanceID...');

            var workflowInstanceID = [];


            TaskInstance.findAll({
                where: {
                    TaskInstanceID: task
                }
            }).then(function(results) {

                //workflowInstanceID.push(results.WorkflowInstanceID);
                results.forEach(function(workflow) {
                    workflowInstanceID.push(workflow.WorkflowInstanceID);
                }, this);

                //console.log('workflowInstanceID was found!');

                resolve(workflowInstanceID);

            }).catch(function(err) {
                console.log('Find workflowInstanceID failed!');
                console.log(err);
            });
        });
    }

    //get students in the workflowInstanceID - this students will be avoided
    getUsersFromWorkflowInstance(wi_id) {



        return new Promise(function(resolve, reject) {

            //console.log('Finding the users in the workflowInstanceID...');

            var avoid_users = [];

            TaskInstance.findAll({
                where: {
                    WorkflowInstanceID: wi_id
                }
            }).then(function(results) {

                results.forEach(function(user) {
                    avoid_users.push(user.UserID);
                }, this);


                //console.log('users in workflowInstanceID were found!');

                resolve(avoid_users);

            }).catch(function(err) {
                console.log('Find users in workflowInstanceID failed!');
                console.log(err);
            });
        });
    }

    //get ti_id where user is allocated within a wi_id
    getTaskInstancesWhereUserAlloc(user, wi_id, ti_id) {
        //console.log('Finding the TaskInstances...');


        return new Promise(function(resolve, reject) {

            var tempAllocRecord = [];
            tempAllocRecord.push(ti_id);

            TaskInstance.findAll({
                where: {
                    WorkflowInstanceID: wi_id,
                    UserID: user
                }
            }).then(function(results) {

                results.forEach(function(result) {
                    if (result.TaskInstanceID > ti_id) {
                        tempAllocRecord.push(result.TaskInstanceID);
                    }
                }, this);

                resolve(tempAllocRecord);
                //console.log('TaskInstances were found!');
                //tempAllocRecord.push(ti_id);


            }).catch(function(err) {
                console.log('Find TaskInstances failed!');
                console.log(err);
            });
        });
    }

    //get newUser
    getUserPre(avoid_users, users) {
        //console.log(typeof users)
        // console.log("getUser() users", users)
        var new_user
        // var new_users = []
        var idx
        return Promise.all(Promise.map(users, function(user, i) {
            if (!_.contains(avoid_users, user)) {
                if (idx == null) {
                    idx = i
                }
                // new_users.push(user)
                // console.log('users shift', users)
            }

        })).then(function(done) {
            new_user = users[idx] //new_users[0]
            // console.log('prev::', users)
            users.splice(idx, 1)
            users.push(new_user)
            // console.log('new::', users)
            return new_user
        })
    }

    //get newUser
    getUser(users, volunteers, avoidUsers) {
        volunteers = volunteers || []
        var found = false
        return Promise.map(users, function(user) {
            if (!found && !_.contains(avoidUsers, user) && !_.contains(volunteers, user)) {
                volunteers.unshift(user)
                found = true
            }
        }).then(function(done) {
            var idx = 0
            return Promise.map(volunteers, function (user, i) {
                if (!found && idx == null && !_.contains(avoid_users, user)) {
                    idx = i
                }
            }).then(function (done) {
                var new_user = volunteers[idx] //new_users[0]
                // console.log('prev::', users)
                volunteers.splice(idx, 1)
                volunteers.push(new_user)
                // console.log('update::', volunteers)
                return new_user
            })
        })
    }


    //updateDB
    updateUSER(ti, newUser) {
        var taskid = ti.TaskInstanceID
        var json = JSON.parse(ti.UserHistory) || {}
        json[new Date()] = newUser

        //console.log('Updating task instance...')

        return TaskInstance.update({
            UserID: newUser,
            UserHistory: json,
        }, {
            where: {
                TaskInstanceID: taskid
            }
        }).then(function(result) {
            console.log('User updated! ', newUser);
            return result
        }).catch(function(err) {
            console.log('Cannot update user!');
            console.log(err);
        });

    }

    getVolunteers(ti) {
        /*return WorkflowInstance.find({
            where: {
                WorkflowInstanceID: ti.WorkflowInstanceID
            }
        }).then(function(wfi) {
            return JSON.parse(wfi.Volunteers)
        })*/
        return AssignmentInstance.find({
            where: {
                AssignmentInstanceID: ti.AssignmentInstanceID
            }
        }).then(function(ai) {
            return JSON.parse(ai.Volunteers)
        })
    }

    //////////////////////////////////////////////////////////////////
    ///////////////Reallocate user within a workflow//////////////////
    //////////////////////////////////////////////////////////////////

    //ti_id = User(TaskInstanceID) to be reallocated
    //userList = list of users within a section
    //x.getLateUser(task) = the user that has been late for submitting his/her work; TaskInstance Type has been marked as 'late'
    //x.getTaskActivityID(task) & x.getWorkflowInstanceID(task) = find TaskActivityID and WorkflowInstanceID associate with the task
    //Promise.map(list, function(each_index_from_the_list){}) - for details you can check bluebird.js
    //x.getUsersFromWorkflowInstance(wi_id) = find users within the same workflow, used to find the list of user that should be avoided
    //x.getTaskInstancesWhereUserAlloc(lateUser, wi_id, task) = find all the TaskInstances within the workflow that have the same UserID
    //x.getUser(avoidUsers, users) = find the User that's not part of the avoided list and use that user to replace the current user
    //x.updateUSER(task, newUser) = find the task that needs to allocate and replace the user

    //Needs to fix: The algorithm would always reallocate the first user from the list obtained. Needs to update the list of the users so
    //the same user won't be reallocated second time.

    reallocate(ti, users) {
        var ti_id = ti.TaskInstanceID
        var x = this;
        var task = ti_id; //task instance needs to be given
        var constraint;
        var lateUser;
        var avoid_users = [];
        // var users = userList; // users need to be given
        //console.log(users);

        /*Promise.all([]).spread(function(lateUsers, volunteers) {
            lateUser = done[0];
            //console.log(lateUser);
        });*/
        return Promise.all([x.getLateUser(task), x.getVolunteers(ti), x.getTaskActivityID(task), x.getWorkflowInstanceID(task)]).spread(function(lateUsers, volunteers, taskActivityIDs, workflowInstanceIDs) {
            // console.log('vol:' + volunteers)
            volunteers = volunteers || []
            return Promise.map(taskActivityIDs, function(ta_id) {
                //console.log(ta_id);
                return Promise.map(workflowInstanceIDs, function(wi_id) {
                    //console.log(wi_id);
                    return Promise.all([x.getUsersFromWorkflowInstance(wi_id), x.getTaskInstancesWhereUserAlloc(lateUsers[0], wi_id, task)]).spread(function(avoidUsers, TaskInstances) {
                        // console.log("avoidUsers", avoidUsers);
                        // avoidUsers.map(function(user) {
                        //     avoid_users.push(user);
                        // });
                        return x.getUser(users, volunteers, avoidUsers).then(function(newUser) {
                            return Promise.map(TaskInstances, function(task) {
                                /*WorkflowInstance.update({
                                    Volunteers: volunteers
                                }, {
                                    where: {
                                        WorkflowInstanceID: ti.WorkflowInstanceID
                                    }
                                })*/
                                return AssignmentInstance.update({
                                    Volunteers: volunteers
                                }, {
                                    where: {
                                        AssignmentInstanceID: ti.AssignmentInstanceID
                                    }
                                }).then(function(result) {
                                    console.log('vols updated! ', volunteers)
                                    return x.updateUSER(ti, newUser);
                                }).catch(function(err) {
                                    console.log('Cannot update vols!')
                                    console.log(err)
                                })
                            });
                        });
                        //console.log(newUser);
                    });
                });
            });
        });
    }


    //finds the students from the same section
    findSectionUsers(ai_id, callback) {
        AssignmentInstance.find({
            where: {
                AssignmentInstanceID: ai_id
            }
        }).then(function(result) {
            SectionUser.findAll({
                where: {
                    SectionID: result.SectionID
                }
            }).then(function(users) {
                var userArray = [];
                Promise.map(users, function(user) {
                    userArray.push(user.UserID);
                }).then(function(done) {
                    console.log("Users:", userArray);
                    callback(userArray);
                });
            }).catch(function(err) {
                console.log(err);
                throw Error("Cannot find TaskActivity!");
            });
        });
    }

    //finds group members
    findGroupUsers(g_id, callback) {

    }

    //finds group members
    findInstructor(ai_id, callback) {
        AssignmentInstance.find({
            where: {
                AssignmentInstanceID: ai_id
            }
        }).then(function(result) {
            Assignment.find({
                where: {
                    AssignmentID: result.AssignmentID
                },
                attributes: ["OwnerID"]
            }).then(function(instructor) {
                console.log("Inustructor:", instructor.OwnerID);
                callback(instructor.OwnerID);
            }).catch(function(err) {
                console.log(err);
                throw Error("Cannot find TaskActivity!");
            });
        });
    }




};




module.exports = Allocator;
