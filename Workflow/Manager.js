var models = require('../Model');
var TaskFactory = require('./TaskFactory.js');
var Promise = require('bluebird');
var Allocator = require('./Allocator.js');
var Email = require('./Email.js');
var Make = require('./Make.js');
var TaskTrigger = require('./TaskTrigger.js');

var FileReference = models.FileReference;
var User = models.User;
var UserLogin = models.UserLogin;
var UserContact = models.UserContact;
var Course = models.Course;
var Section = models.Section;
var SectionUser = models.SectionUser;

var Semester = models.Semester;
var TaskInstance = models.TaskInstance;
var TaskGrade = models.TaskGrade;
var TaskSimpleGrade = models.TaskSimpleGrade;
var TaskActivity = models.TaskActivity;
var Assignment = models.Assignment;
var AssignmentGrade = models.AssignmentGrade;
var AssignmentInstance = models.AssignmentInstance;

var WorkflowInstance = models.WorkflowInstance;
var WorkflowGrade = models.WorkflowGrade;
var WorkflowActivity = models.WorkflowActivity;
var ResetPasswordRequest = models.ResetPasswordRequest;
var EmailNotification = models.EmailNotification;


var taskFactory = new TaskFactory();
var trigger = new TaskTrigger();
var alloc = new Allocator();
var email = new Email();
var make = new Make();
const logger = require('winston');

/**
 *
 * @constructor
 */

class Manager {

    async check() {
        var x = this;

        logger.log('info', '/Workflow/Manager/check(): initiating...');
        var lst = await TaskInstance.findAll({
            where: {
                $or: [{
                    Status: {
                        $like: '%"started"%'

                    }
                }, {
                    Status: {
                        $like: '%"late_reallocated"%'
                    }
                }],
                $and: {
                    Status: {
                        $notLike: '%"late"%'
                    }
                }
            },
            include: [{
                model: AssignmentInstance,
                attributes: ['AssignmentInstanceID', 'AssignmentID', 'WorkflowTiming'],
                include: [{
                    model: Section,
                    attributes: ['SectionID'],
                }],
            }, {
                model: TaskActivity,
                attributes: ['Type', 'WhatIfLate', 'AtDurationEnd', 'DueType']
            }]
            // raw: true
        });

        var res = {};
        //TODO: for users list, replace it with: get volunteers that are active in section user [see commented lines, TODOs]
        await Promise.mapSeries(lst, function (it) {
            // console.log(it.TaskInstanceID, it.AssignmentInstance.Section.SectionID, it.UserID)
            var secId = it.AssignmentInstance.Section.SectionID;
            if (!res[secId]) {
                res[secId] = {
                    tasks: [],
                    users: []
                }; //TODO: comment this line once volunteers are used instead
                // res[secId] = {tasks: [], users: getActiveVolunteers(secId)} //TODO: uncomment this line once volunteers are used instead
            }
            res[secId].tasks.push(it);
            //res[secId].users.push(it.UserID); //TODO: call get Volunteers and make sure they are active
        });

        // console.log('then....' + res)
        await Object.keys(res).forEach(async function (secId) {
            var users = await make.getUsersFromSection(secId); //TODO: call get Volunteers instead everyone from that section
            console.log(users);
            Promise.each(res[secId].tasks, async function (task) {
                console.log('Checking Task Instance', task.TaskInstanceID);
                await x.checkTask(task, users);
            });
        });
        /*var x = this;
        TaskInstance.findAll({
            where: {
                $or: [{
                    Status: "started"
                }, {
                    Status: "late_reallocated"
                }]
            }
        }).then(function(taskInstances) {
            if (taskInstances.length === 0) {
                console.log("No Task Instance Found!");
            }
            else {
                alloc.groupSectionUsers(taskInstances, function (res) {
                    console.log('res::', res)
                });
                alloc.findSectionUsers(taskInstances[0].AssignmentInstanceID, function (users) {
                    taskInstances.forEach(function (task) {
                        console.log('Checking Task Instance', task.TaskInstanceID);
                        x.checkTask(task, users);
                        //check for started task instances
                    });
                });
            }
            /!*taskInstances.forEach(function(task) {
                console.log('Checking Task Instance', task.TaskInstanceID);
                x.checkTask(task);
                //check for started task instances
            });*!/
        });*/
    }

    async checkTask(task, users) {
        //only check for started
        var x = this;
        var date = await task.timeOutTime();
        var now = new Date();
        if (date < now) {
            await x.timeOut(task, users);
        }
    }

    checkLate() {
        var x = this;
        TaskInstance.findAll({
            where: {
                Status: '%"late"%'
            }
        }).then(function (taskInstances) {
            taskInstances.forEach(function (task) {
                email.send(task.UserID, 'late');
            });
        });
    }

    checkAssignments() {
        var x = this;
        AssignmentInstance.findAll({
            where: {
                EndDate: null
            }
        }).then(function (AIs) {
            return Promise.mapSeries(AIs, function (assignmentInstance) {
                console.log('checkAssginments: AssignmentInstanceID', assignmentInstance.AssignmentInstanceID);
                return x.checkAssignment(assignmentInstance);
            });
        });
    }

    checkAssignment(assignmentInstance) {
        var x = this;
        var startDate = assignmentInstance.StartDate;

        var now = new Date();

        if (startDate < now) {
            console.log('checkAssginment: Start Date has past ', assignmentInstance.AssignmentInstanceID);
            return x.isStarted(assignmentInstance, function (result) {
                console.log('checkAssignment: ', assignmentInstance.AssignmentInstanceID, result);
                if (!result)
                    //return taskFactory.createInstances(assignmentInstance.SectionID, assignmentInstance.AssignmentInstanceID);
                    return make.allocateUsers(assignmentInstance.SectionID, assignmentInstance.AssignmentInstanceID);
            });
        }
    }

    isStarted(assignmentInstance, callback) {
        WorkflowInstance.count({
            where: {
                AssignmentInstanceID: assignmentInstance.AssignmentInstanceID
            }
        }).then(function (count) {
            callback(count > 0 ? true : false);
        });
    }

    async timeOut(task, users) {
        //var alloc = new Allocator();
        //check the option whether keep the same person or allocate to a new person
        //extended date is in DueType second postion

        // WhatIfLate: (0 = keep_same_participant, 1 = allocate_new_person_from_contingency_pool,
        // 2 = allocate_to_different_person_in_same_group, 3 = abandon_task, 4 = resolved_task, 5 = allocate to
        // new instructor and more. If # > 0 then change status to overtime)

        //Change parameter WhatIfLate to Array of [action, number(days)];

        //decision point to decide change the status whether late, abandon, or complete

        console.log('timeOut');
        var x = this;
        var status = JSON.parse(task.Status);
        if (task.TaskActivity.Type === 'dispute') {
            trigger.skipDispute(task.TaskInstanceID);
        } else {

            switch (task.TaskActivity.AtDurationEnd) {
                case '"late"':
                    //check WhatIfLate action
                    await x.whatIfLate(task, users);
                    break;
                case 'resolve':
                    status[0] = 'complete';
                    await x.updateStatus(task, status);
                    await trigger.bypassAllSubworkflows(task);
                    //submitted. Stop task instance and continue subworkflow task status = complete
                    break;
                case 'abandon':
                    status[0] = 'abandoned';
                    await x.updateStatus(task, status);
                    await trigger.bypassAllSubworkflows(task);
                    //abandoning subworkflow. status = complete
                    //*add subworkflow complete.
                    //Skip to subworkflow complete
                    break;
                case 'complete':
                    //change status to complete and begin next tasks`
                    status[0] = 'complete';
                    await x.updateStatus(task, status);
                    await trigger.next(task.TaskInstanceID);
                    break;
                default:
                    console.log('AtDurationEnd does not fall into any category.');
            }

        }

    }

    async updateStatus(task, status) {
        task.Status = JSON.stringify(status);
        await task.save();
    }

    async whatIfLate(task, users) {
        var x = this;
        var status = JSON.parse(task.Status);;
        switch (task.TaskActivity.WhatIfLate) {
            case '"keep_same_participant"':
                status[3] = 'late';
                await x.updateStatus(task, status);

                //email.sendNow(task.UserID, 'late');
                break;
            case '"allocate_new_participant_from_contigency_pool"':

                status[5] = 'reallocated_extra_credit';
                await x.updateStatus(task, status);
                //Run allocation algorithm, extend due date.
                await task.extendDate(JSON.parse(task.TaskActivity.DueType)[1]);
                await alloc.reallocate(task, users).then(async function (done) {
                    console.log(done);
                    if (!done || !done[0]) {
                        return;
                    } else {
                        console.log('now saving');
                        await task.save();
                    }
                });
                //send email to notify user about allocation
                break;
            case '"allocate_to_different_person_in_same_group"':
                status[0] = 'started';
                await x.updateStatus(task, status);
                //Run allocation algorithm specifiy with team, extend due date.
                alloc.findGroupUsers(task.GroupID, function (users) {
                    //alloc.reallocate(task.TaskInstanceID, users);
                });
                //send email to notify user about allocation
                break;
            case '"allocate_to_instructor"':
                console.log('TaskInstance ', task.TaskInstanceID, ': Allocating instructor to the task...');
                status[0] = 'started';
                await x.updateStatus(task, status);
                //Run allocation algorithm specifiy with team, extend due date
                alloc.findInstructor(task.AssignmentInstanceID, function (instructor) {
                    alloc.reallocate_user_to_task(task, instructor, false);
                    task.extendDate(JSON.parse(task.TaskActivity.DueType)[1]);
                });
                //send email to notify user about allocation
                break;
                // case "abandon_task":
                //     this.Status = "complete";
                //     break;
                // case "resolved_task":
                //     this.Status = "complete";
                //     break;
            default:
                logger.log('error', '/Workflow/Manager/whatIfLate: Fatal! Unknown case!');
        }
    }
}







// Manager.checkTimeoutTaskInstances = function() {
//     TaskInstance.findAll({
//         where: {
//             $or: [{
//                 Status: "triggered"
//             }, {
//                 Status: "started"
//             }]
//         }
//     }).then(function(tasks) {
//         tasks.forEach(function(task) {
//             Manager.checkTimeoutTaskInstance(task);
//         });
//
//
//     });
// }
//
//
// Manager.checkTimeoutTaskInstance = function(task) {
//
//
//     task.timeoutTime(function(date) {
//
//             var now = new Date();
//             if (date < now) {
//                 task.timeOut();
//             }
//         })
//         /*//  console.log("Calling CheckOutTaks Function");
//           //task.timeOut();
//           test = {type: "task status", 'task type' : "create problem" , "task status" : "triggered"};
//          // task.addTriggerCondition(test);
//
//
//            //       task.complete();*/
// }
//
//
// Manager.checkTaskInstances = function() {
//     TaskInstance.findAll({
//         where: {
//             $or: [{
//                 Status: "not triggered"
//             }, {
//                 Status: "triggered"
//             }, {
//                 Status: "started"
//             }]
//         }
//     }).then(function(tasks) {
//         tasks.forEach(function(task) {
//             Manager.checkTaskInstance(task);
//         });
//
//
//     });
// }
//
// Manager.checkTaskInstance = function(task) {
//     task.triggerConditionsAreMet(function(result) {
//         if (result)
//             task.trigger();
//     });
//
//     task.expireConditionsAreMet(function(result) {
//         if (result)
//             task.expire();
//     });
// }
//
// Manager.checkAssignments = function() {
//     AssignmentInstance.findAll({
//         where: {
//             EndDate: null
//         }
//     }).then(function(assignmentInstances) {
//         assignmentInstances.forEach(function(assignmentInstance) {
//             Manager.checkAssginment(assignmentInstance);
//         });
//
//
//     });
//
// }
//
// Manager.checkAssginment = function(assignmentInstance) {
//     var startDate = assignmentInstance.StartDate;
//
//     var now = new Date();
//
//     if (startDate < now) {
//         Manager.isStarted(assignmentInstance, function(result) {
//             if (result)
//                 Manager.trigger(assignmentInstance);
//         });
//     }
//
// }
// Manager.isStarted = function(assignmentInstance, callback) {
//     WorkflowInstance.count({
//         where: {
//             AssignmentID: assignmentInstance.AssignmentID
//         }
//     }).then(function(count) {
//         callback(count > 0 ? true : false);
//     });
// }
//
// /**
//  * Returns the assignment based on the assignment section
//  * @param assignmentInstance
//  */
// Manager.getAssignments = function(assignmentInstance) {
//     return Assignment.findById(assignmentInstance.AssignmentID).then(function(assignment) {
//         return assignment;
//     });
// }
//
// /**
//  * Returns the list of users assigne to the section
//  * @param assignmentInstance
//  */
// Manager.getUserSection = function(assignmentInstance) {
//     return SectionUser.findAll({
//         where: {
//             SectionID: assignmentInstance.SectionID,
//             Active: true,
//             Role: 'Student'
//         },
//         include: [{
//             model: User
//         }]
//     }).then(function(assignment) {
//         return assignment;
//     });
// }
//
// /**
//  * reutrning the workflow activity 1.
//  * We need to find a way to get the Workflow activity in general
//  * from the assignment or section some how.
//  */
// Manager.getWorkflowActivity = function() {
//     return WorkflowActivity.findById(1).then(function(workflowActivity) {
//         return workflowActivity;
//     });
// }
//
//
// /**
//  * Triggers when the start date has been reached fro the adssignment instance(assgnment section)
//  * @param assignmentInstance
//  */
// Manager.trigger = function(assignmentInstance) {
//
//
//
//     Promise.all([Manager.getAssignments(assignmentInstance), Manager.getUserSection(assignmentInstance), this.getWorkflowActivity()]).then(function(result) {
//         var assignment = result[0];
//         var S_User = result[1];
//         var workflowActivity = result[2];
//
//         for (var i = 0; i < S_User.length; i++) {
//             var sectionUser = S_User[i];
//
//
//             /**
//              * Creating each workflowInstance
//              */
//             var workflowInstance = WorkflowInstance.build({
//                 //Type: workflowActivity.Name,
//                 StartTime: new Date(),
//                 EndTime: assignmentInstance.EndDate,
//                 AssignmentInstanceID: assignmentInstance.AssignmentInstanceID,
//                 WorkflowActivityID: workflowActivity.WorkflowActivityID,
//                 TaskCollection: JSON.parse("{}"),
//                 Data: JSON.parse("{}")
//             });
//
//
//             Promise.all([
//                 workflowInstance.save().then(function(workflow) {
//                     return workflow;
//                 }),
//                 Manager.getTaskActivity(workflowActivity.WorkflowActivityID, assignment)
//             ]).then(function(result) {
//
//
//                 /**
//                  * Creating task for each workflowInstance
//                  */
//                 var workflowInstance = result[0];
//                 var taskActivities = result[1];
//
//                 var promisesArray = [];
//                 for (var i = 0; i < taskActivities.length; i++) {
//                     var currentTaskActivity = taskActivities[i];
//                     var task = TaskInstance.build({
//                         UserID: sectionUser.UserID,
//                         TaskActivityID: currentTaskActivity.TaskActivityID,
//                         WorkflowInstanceID: workflowInstance.WorkflowInstanceID,
//                         AssignmentInstanceID: assignmentInstance.AssignmentInstanceID,
//                         Status: "Incomplete",
//                         StartDate: workflowInstance.StartTime,
//                         EndDate: workflowInstance.EndTime,
//                         Data: JSON.parse("{}"),
//                         UserHistory: null,
//                         FinalGrade: null,
//                         Files: JSON.parse("{}"),
//                         ReferencedTask: null,
//                         NextTasks: null,
//                         PreviousTasks: null,
//                         EmailLastSent: null
//
//                     });
//
//                     /**
//                      * Adding promises to the array
//                      */
//                     promisesArray.push(task.save().then(function(task) {
//                         console.log("task created");
//                     }));
//
//                 }
//
//
//                 Promise.all(promisesArray).then(function(result) {
//
//                     /**
//                      * Once the tasks are created
//                      * we will allocate them to the students
//                      */
//                     var alloc = new Allocator.Allocator();
//                     alloc.Allocate([assignmentInstance.AssignmentID], [assignmentInstance.SectionID]);
//                 });
//
//
//
//             });
//             /*workflowInstance.save().bind([assignment,S_User]).then(function(workflow)
//             {
//                 console.log("Workflow saved");
//
//                 Manager.triggerTaskCreation(workflow,this[0],this[1],Manager.);
//
//             }).catch(function(e){
//                 console.log(e);
//
//             });*/
//
//         }
//
//
//
//
//     });
// }
//
// /**
//  * Create tasks for the TaskActivities
//  */
// Manager.getTaskActivity = function(workflowActivityID, assignment) {
//     return TaskActivity.findAll({
//         where: {
//             WorkflowActivityID: workflowActivityID,
//             AssignmentID: assignment.AssignmentID
//         }
//     }).then(function(taskActivities) {
//         return taskActivities;
//     });
// }
// Manager.notifyUser = function(event, task) {
//     //Waiting for email sending piece from Christian
// }
//
//
// Manager.CrateTaskFromTaskAcivity = function(workflowInstance) {
//
// }
//
// Manager.triggerTaskCreation = function(workflowInstance, assignment, users, tasks) {
//     var factory = new TaskFactory.TaskFactory(workflowInstance, tasks);
//     factory.createTaskInstances();
// }
//
//
// /**
//  * Get the workflowInstance tasks
//  *
//  * @return array
//  */
// Manager.getTaskInstances = function(assignmentInstance) {
//     return TaskInstance.findAll({
//         where: {
//             AssignmentID: assignmentInstance.AssignmentID
//         }
//     }).then(function(tasks) {
//         return tasks;
//     });
// }
//
// /**
//  * Resolve a Human TaskInstance Name
//  *
//  * @return string The Human Version of the Type
//  * @param string The type
//  */
//
// //Should from database
// Manager.humanTaskInstance = function(type) {
//     var action_human = '';
//     switch (type) {
//         case 'create problem':
//             action_human = 'Create a Problem';
//             break;
//         case 'edit problem':
//             action_human = 'Edit a Problem';
//             break;
//
//         case 'grade solution':
//             action_human = 'Grade a Solution';
//             break;
//
//         case 'create solution':
//             action_human = 'Create a Solution';
//             break;
//
//         case 'resolution grader':
//             action_human = 'Resolve Grades';
//             break;
//         case 'dispute':
//             action_human = 'Decide Whether to Dispute';
//             break;
//         case 'resolve dispute':
//             action_human = 'Resolve Dispute';
//             break;
//         default:
//             action_human = 'Unknown Action';
//     }
//     return action_human;
// }
//
// /**
//  * Retrieve the roles a user can have in a section
//  *
//  * @return Array
//  */
// Manager.getUserRoles = function() {
//     return ['student', 'instructor'];
// }

module.exports = Manager;