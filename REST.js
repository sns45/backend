var mysql = require("mysql");
var dateFormat = require('dateformat');
var Guid = require('guid');
var models = require('./Model');
var Promise = require('bluebird');

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
var Manager = require('./WorkFlow/Manager.js');
var Allocator = require('./WorkFlow/Allocator.js');
var Allocator2 = require('./WorkFlow/Allocator2.js');
var Allocator3 = require('./WorkFlow/Allocator3.js');
var sequelize = require("./Model/index.js").sequelize;
//var server = require('./Server.js');

//var User = server.app.get('models').User;

//-----------------------------------------------------------------------------------------------------


function REST_ROUTER(router, connection, md5) {
    var self = this;
    self.handleRoutes(router, connection, md5);
}

//-----------------------------------------------------------------------------------------------------

REST_ROUTER.prototype.handleRoutes = function(router, connection, md5) {

    //Endpoint to Create an Assignment
    router.post("/assignment/create", function(req, res) {

        /*******************************
         *     Exectuing Transaction   *
         *      if something fails,    *
         *  changes will be rolledback *
         *******************************/

        sequelize.transaction(function(t) {
            "use strict";
            /**
             * Defining assignment
             */
            var assignment = Assignment.build({
                UserID: req.body.assignment.UserID,
                Name: req.body.assignment.AA_name,
                Course: req.body.assignment.AA_course,
                Instructions: req.body.assignment.AA_instructions,
                Type: req.body.assignment.AA_type,
                DisplayName: req.body.assignment.AA_display_name,
                Section: req.body.assignment.AA_section,
                Semester: req.body.assignment.AA_semester,
                GradeDistribution: req.body.assignment.AA_grade_distribution,
                Documentation: req.body.assignment.AA_documentation
            });
            /**
             * save changes for assignment
             */
            return assignment.save({
                transaction: t
            }).then(function(assignment) {
                //for (let workflow of req.body.assignment.WorkflowActivity) {
                /**
                 * Getting  workflow for assignment
                 */
                var workflow = req.body.assignment.WorkflowActivity;
                console.log("creating workflow");
                /**
                 * Defining Workflow
                 */
                var workFlow = WorkflowActivity.build({
                    AssignmentID: assignment.AssignmentID,
                    Type: workflow.WA_type,
                    Name: workflow.WA_name,
                    GradeDistribution: workflow.WA_grade_distribution,
                    NumberOfSets: workflow.WA_number_of_sets,
                    Documentation: workflow.WA_documentation,
                    GroupSize: workflow.WA_default_group_size,
                    StartTaskActivity: workflow.WA_starting_TA
                });
                var promises = [];
                /**
                 * Saving Changes
                 */
                return workFlow.save({
                    transaction: t
                }).then(function(workflow) {
                    "use strict";
                    console.log("Succesfully creation of wokflow activity");
                    /**
                     * Creating each TaskActivity for the assignment
                     */
                    for (var taskactivity in req.body.assignment.TaskActivity) {

                        console.log("Creating taskActivity");

                        var taskActivity = TaskActivity.build({
                            WorkflowActivityID: workflow.WorkflowActivityID,
                            AssignmentID: assignment.AssignmentID,
                            Type: workflow.tasks.TA_type,
                            Name: workflow.tasks.TA_name,
                            FileUpload: workflow.tasks.TA_file_upload,
                            DueType: workflow.tasks.TA_due_type,
                            StartDelay: workflow.tasks.TA_start_delay,
                            AtDurationEnd: workflow.tasks.TA_at_duration_end,
                            WhatIfLate: workflow.tasks.TA_what_if_late,
                            DisplayName: workflow.tasks.TA_display_name,
                            Documentation: workflow.tasks.TA_documentation,
                            OneOrSeparate: workflow.tasks.TA_one_or_separate,
                            AssigneeConstraints: workflow.tasks.TA_assignee_constraints,
                            Difficulty: workflow.tasks.TA_difficulty,
                            SimpleGrade: workflow.tasks.TA_simple_grade,
                            IsFinalGradingTask: workflow.tasks.TA_is_final_grading_task,
                            Instructions: workflow.tasks.TA_overall_instructions,
                            Rubric: workflow.tasks.TA_rubric,
                            Fields: workflow.tasks.TA_fields,
                            AllowReflection: workflow.tasks.TA_allow_reflection,
                            AllowRevision: workflow.tasks.TA_allow_revisions,
                            AllowAssessment: workflow.tasks.TA_allow_assessment,
                            NumberParticipants: workflow.tasks.TA_number_participants,
                            TriggerConsolidationThreshold: workflow.tasks.TA_trigger_consolidation_threshold,
                            FunctionType: workflow.tasks.TA_function_type,
                            Function: workflow.tasks.TA_function,
                            AllowDispute: workflow.tasks.TA_allow_dispute,
                            LeadsToNewProblem: workflow.tasks.TA_leads_to_new_problem,
                            LeadsToNewSolution: workflow.tasks.TA_leads_to_new_solution,
                            VisualID: workflow.tasks.TA_visual_id
                        });
                        /**
                         * Adding Promises to array
                         * for just one time execution
                         */
                        promises.push(taskActivity.save({
                            transaction: t
                        }));
                    }
                    /**
                     * Executing task creation changes all at once
                     */
                    return Promise.all(promises, {
                        transaction: t
                    });
                });
            })
        }).then(function(result) {
            /**
             * Transcation has been succesful
             * Changes have been commited
             */
            //Loggin error
            console.log("Assignment Creation succesfully");
            res.status(200).end();

        }).catch(function(err) {
            // Transaction has been rolled back
            // err is the reason why rejected the promise chain returned to the transaction callback
            console.log("Assignment Creation has failed");
            //Loggin error
            console.log(err);
            res.status(400).end();


        });
    });

    //-----------------------------------------------------------------------------------------------------


    //Endpoint for Assignment Allocator
    router.get("/allocator", function(req, res) {

        var alloc = new Allocator.Allocator();
        alloc.Allocate([1], [1]);
        //alloc.createRole('test');
        //var a = [];
        //alloc.count(a);
    });

    router.get("/allocate", function(req, res) {
        var alloc3 = new Allocator3.Allocator3();

        //alloc3.getNumberParticipants(23);
        //alloc3.createInstances(3, 13);
        alloc3.updatePreviousAndNextTasks(13);
        // alloc3.createAssignmentInstances(1, 3, '2016-07-12', {
        //     'workflows': [{
        //         'id': 10,
        //         'startDate': '2016-07-15',
        //         'tasks': [{
        //             'id': 20,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 21,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 22,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 23,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 24,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 25,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 26,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 27,
        //             'DueType': ['duration', 4000]
        //         }, {
        //             'id': 28,
        //             'DueType': ['duration', 4000]
        //         }, ]
        //     }]
        // });
        //alloc3.getWorkflowTiming(13);
    });


    //-----------------------------------------------------------------------------------------------------

    //Endpoint for Assignment Manager
    router.get("/manager", function(req, res) {

        //Manager.Manager.checkTimeoutTasks();
        AssignmentInstance.findById(1).then(
            function(asection) {
                Manager.Manager.trigger(asection);

            }
        );
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to Test All Models for a UserID
    router.get("/ModelTest/:userID", function(req, res) {


        WorkflowInstance.findById(req.params.userID).then(function(WorkflowInstance) {
            console.log("WorkflowInstance Found");

            WorkflowInstance.getWorkflowActivity().then(function(workflowActivity) {
                console.log("WorkflowActivity Found " + workflowActivity.Name);
            });

            WorkflowInstance.getAssignment().then(function(assignment) {
                console.log("Assignment Found : " + assignment.Title);
            });
        });

        WorkflowActivity.findById(req.params.userID).then(function(workflowActivity) {
            console.log("WorkflowActivity Found " + workflowActivity.Name);

            workflowActivity.getWorkflowInstances().then(function(workflows) {
                console.log("workflows Found ");
            });

        });

        Assignment.findById(req.params.userID).then(function(assignment) {
            console.log("Assignment Found : " + assignment.Title);

            assignment.getWorkflowInstances().then(function(workflows) {
                console.log("workflows Found ");
            });

        });

        TaskInstance.findById(req.params.userID).then(function(taskInstance) {
            console.log("Semester name : " + taskInstance.TaskInstanceID);

            taskInstance.getUser().then(function(User) {
                console.log("TaskInstance User Name " + User.FirstName);
            });
            taskInstance.getTaskActivity().then(function(TaskActivity) {
                console.log("TaskActivity Name " + TaskActivity.Name);
            });

        });

        TaskActivity.findById(2).then(function(TaskActivity) {
            console.log("TaskActivity name : " + TaskActivity.Name);

            TaskActivity.getTaskInstances().then(function(TaskInstances) {
                console.log("Found");
            });

        });

        Semester.findById(req.params.userID).then(function(Semester) {
            console.log("Semester name : " + Semester.Name);

            Semester.getSections().then(function(Sections) {
                console.log("Found");
            });

        });

        Section.findById(req.params.userID).then(function(Section) {
            console.log("Section name : " + Section.Name);

            Section.getSemester().then(function(Semester) {
                console.log("Semester Name : " + Semester.Name);
                //res.status(200).end();
            });

            Section.getCourse().then(function(Course) {
                console.log("Course Title : " + Course.Title);
                //res.status(200).end();
            });
            Section.getSectionUsers().then(function(Users) {
                console.log("Found");
                //res.status(200).end();
            });

        });

        UserLogin.findById(req.params.userID).then(function(user) {
            console.log("User Email : " + user.Email);

        });

        Course.findById(req.params.userID).then(function(course) {
            console.log("User Course : " + course.Title);

            course.getUser().then(function(Creator) {
                console.log("Creator Name : " + Creator.FirstName);
                //res.status(200).end();
            });

            course.getSections().then(function(sections) {
                console.log('Sections Found');
            });
        });
        //Course.find
        User.findById(req.params.userID).then(function(user) {
            console.log("User name : " + user.FirstName);
            var UserLog = user.getUserLogin().then(function(USerLogin) {
                console.log("User Email : " + USerLogin.Email);

            });
            user.getUserContact().then(function(USerLogin) {
                console.log("User Email : " + USerLogin.Email);
                res.status(200).end();
            });
            //console.Log("Email " + UserLog.Email);
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint for Login Function
    router.post("/login", function(req, res) {
        if (req.body.emailaddress == null || req.body.password == null) {
            console.log('/login : Invalid Credentials');
            res.status(401).end();
            return;
        }

        UserLogin.find({
            where: {
                Email: req.body.emailaddress,
                Password: md5(req.body.password)
            },
            attributes: ['UserID']
        }).then(function(user) {
            if (user == null) {
                console.log('/login : Invalid Credentials');
                res.status(401).end()
            } else {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "UserID": user.UserID
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to update a User's Email
    router.put("/update/email", function(req, res) {
        if (req.body.password == null || req.body.email == null || req.body.userid == null) {
            console.log("/update/email : Bad Input");
            res.status(400).end();
        }

        UserLogin.find({
            where: {
                UserID: req.body.userid,
                Password: md5(req.body.password)
            }
        }).then(function(user) {
            if (user == null) {
                console.log('/update/email : Bad Input');
                res.status(401).end();
            } else {
                user.Email = req.body.email;
                user.save().then(function(used) {
                    res.status(200).end();
                }).catch(function(err) {
                    res.json({
                        'Email': used.Email
                    });
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to update a User's Name
    router.put("/update/name", function(req, res) {
        User.find({
            where: {
                UserID: req.body.userid
            }
        }).then(function(user) {
            if (user == null) {
                console.log('/update/name : UserID not Found');
                res.status(401).end();
            } else {
                if (req.body.firstname != '') {
                    user.FirstName = req.body.firstname;
                }
                if (req.body.lastname != '') {
                    user.LastName = req.body.lastname;
                }
                user.save().then(function(used) {
                    res.json({
                        "FirstName": user.FirstName,
                        "LastName": user.LastName
                    });
                }).catch(function(err) {
                    console.log('/update/name : ' + err);
                    res.status(401).end();
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to return general user data
    router.get("/generalUser/:userid", function(req, res) {
        User.findAll({
            where: {
                UserID: req.params.userid
            },
            attributes: ['FirstName', 'LastName', 'UserType', 'Admin'],
            include: [{
                model: UserLogin,
                attributes: ['Email']
            }]
        }).then(function(user) {
            res.json({
                "Error": false,
                "Message": "Success",
                "User": user
            });
        }).catch(function(err) {
            console.log("/generalUser : " + err.message);
            res.status(401).end();
        });

    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to create a semester
    router.post("/createSemester", function(req, res) {

        var startDate = dateFormat(req.body.startdate, "yyyy-mm-dd");
        var endDate = dateFormat(req.body.enddate, "yyyy-mm-dd");
        if (req.body.enddate == null || req.body.startdate == null) {
            console.log("/createSemester : Dates must be defined");
            res.status(400).end();
        } else if (startDate > endDate) {
            console.log("/createSemester : StartDate cannot be grater than EndDate");
            res.status(400).end();
        } else {
            var semester = Semester.build({
                Name: req.body.name,
                StartDate: req.body.startdate,
                EndDate: req.body.enddate,
                OrganizationID: req.body.organizationid

            }).save().then(function(response) {
                console.log("/createSemester Succesfully");
                res.json({
                    "SemesterID": response
                });
            }).catch(function(err) {
                console.log("/createSemester : " + err.message);
                res.status(400).end();
            });
        }



    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to return Semester Information
    router.get("/semester/:semesterid", function(req, res) {

        Semester.findAll({
            where: {
                SemesterID: req.params.semesterid
            },
            attributes: ['SemesterID', 'Name', 'StartDate', 'EndDate', 'OrganizationID']
        }).then(function(rows) {
            res.json({
                "Error": false,
                "Message": "Success",
                "Course": rows
            });
        }).catch(function(err) {
            console.log("/semester/email : " + err.message);
            res.status(401).end();
        });


    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to get All Semester Information
    router.get("/semester", function(req, res) {

        Semester.findAll({}).then(function(rows) {
            res.json({
                "Error": false,
                "Message": "Success",
                "Semesters": rows
            });
        }).catch(function(err) {
            console.log("/semester: " + err.message);
            res.status(401).end();
        });
    });

    //-----------------------------------------------------------------------------------------------------

    router.post("/course/create", function(req, res) {

        if (req.body.userid == null) {
            console.log("/course/create : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.title == null) {
            console.log("/course/create : Title cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.number == null) {
            console.log("/course/create : Number cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.organizationid == null) {
            console.log("/course/create : OrganizationID cannot be null");
            res.status(400).end();
            return;
        }

        var course = Course.build({
            CreatorID: req.body.userid,
            Number: req.body.number,
            Title: req.body.title,
            OrganizationID: req.body.organizationid //new

        }).save().then(function(response) {
            res.json({
                "NewCourse": response
            });
        }).catch(function(err) {
            console.log("/course/create : " + err.message);

            res.status(400).end();
        });


    });

    //-----------------------------------------------------------------------------------------------------

    router.post("/course/createsection", function(req, res) {


        if (req.body.semesterid == null) {
            console.log("course/createsection : SemesterID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.courseid == null) {
            console.log("course/createsection : CourseID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.name == null) {
            console.log("course/createsection : Name cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.description == null) {
            console.log("course/createsection : Description cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.organizationid == null) {
            console.log("course/createsection : OrganizationID cannot be null");
            res.status(400).end();
            return;
        }

        //-----------------------------------------------------------------------------------------------------

        Semester.find({
            where: {
                SemesterID: req.body.semesterid
            }
        }).then(function(results) {
            var section = Section.build({
                SemesterID: req.body.semesterid,
                CourseID: req.body.courseid,
                OrganizationID: req.body.organizationid, //new
                StartDate: results.StartDate,
                EndDate: results.EndDate,
                Name: req.body.name,
                Description: req.body.description

            }).save().then(function(response) {
                res.json({
                    "result": response
                });
            }).catch(function(err) {
                console.log("/course/createsection : " + err.message);

                res.status(401).end();
            });
        });

    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to add a user to a course
    //****Need to look over
    router.put("/course/adduser", function(req, res) {
        if (req.body.email == null || req.body.courseid == null || req.body.coursesectionid == null) {
            console.log("course/adduser : Email cannot be null");
            res.status(400).end();
        }

        UserLogin.find({
            where: {
                UserID: req.body.UserID
            },
            attributes: ['UserID']
        }).then(function(userLogin) {
            if (userLogin.UserID == null) {
                UserContact.create({
                    Email: email,
                    Phone: 'XXX-XXX-XXXX'
                }).catch(function(err) {
                    console.log(err);
                }).then(function(userCon) {
                    User.create({
                        FirstName: 'Temp',
                        LastName: 'Temp',
                        OrganizationGroup: {
                            "OrganizationID": []
                        },
                        UserContactID: userCon.UserContactID,
                        UserType: 'Student',
                        Admin: 0
                    }).catch(function(err) {
                        console.log(err);
                    }).then(function(user) {
                        UserLogin.create({
                            UserID: user.UserID,
                            Email: email,
                            Password: md5('pass123')
                        }).catch(function(err) {
                            console.log(err);
                        }).then(function(userLogin) {
                            //Email User With Password
                            SectionUser.create({
                                SectionID: req.body.sectionid,
                                UserID: userLogin.UserID,
                                UserRole: 'Student',
                                UserStatus: 'Active'
                            }).catch(function(err) {
                                console.log(err);
                            }).then(function(sectionUser) {
                                res.status(200).end();
                            })
                        })
                    });
                });
            } else {
                SectionUser.create({
                    SectionID: req.body.sectionid,
                    UserID: userLogin.UserID,
                    UserRole: 'Student',
                    UserStatus: 'Active'
                }).catch(function(err) {
                    console.log(err);
                }).then(function(sectionUser) {
                    res.json({
                        "UserID": sectionUser.UserID
                    });
                })
            }
        })
    });

    //-----------------------------------------------------------------------------------------------------

    router.get("/course/:courseId", function(req, res) {
        Course.find({
            where: {
                CourseID: req.params.courseId
            },
            attributes: ["CourseID", "Number", "Title"]
        }).then(function(result) {
            Section.findAll({
                where: {
                    CourseID: req.params.courseId
                }
            }).then(function(sections) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Course": result,
                    "Sections": sections
                });
            });

        }).catch(function(err) {
            console.log("/course : " + err.message);
            res.status(400).end();
        })

    });

    //-----------------------------------------------------------------------------------------------------

    //Need to translate getsectionUsers function
    router.get("/course/getsection/:sectionId", function(req, res) {

        Section.find({
            where: {
                SectionID: req.params.sectionId
            },
            attributes: ["Name", "Description"]
        }).then(function(rows) {
            SectionUser.findAll({
                where: {
                    SectionID: req.params.sectionId
                },
                attributes: ['UserID', 'UserRole', 'UserStatus'],
                include: {
                    model: User,
                    attributes: ['UserName', 'FirstName', 'LastName', 'MiddleInitial']
                }
            }).then(function(users) {
                res.json({
                    "result": rows,
                    "UserSection": users
                });
            })
        }).catch(function(err) {
            console.log("/course : " + err.message);
            res.status(400).end();
        })
    });

    //-----------------------------------------------------------------------------------------------------

    router.put("/course/update", function(req, res) {

        if (req.body.Title == null) {
            console.log("course/create : Title cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.courseid == null) {
            console.log("course/create : CourseID cannot be null");
            res.status(400).end();
            return;
        }

        Course.update({
            Title: req.body.Title,
            Number: req.body.Number
        }, {
            where: {
                CourseID: req.body.courseid
            }
        }).then(function(result) {
            Course.find({
                where: {
                    CourseID: req.body.courseid
                }
            }).then(function(courseUpdated) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "result": result,
                    "CourseUpdated": courseUpdated
                });
            });
        }).catch(function(err) {
            console.log('/course/update : ' + err);
            res.status(401).end();
        });


    });

    //-----------------------------------------------------------------------------------------------------

    router.put("/course/updatesection", function(req, res) {

        if (req.body.semesterid == null) {
            console.log("course/updatesection : SemesterID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.courseid == null) {
            console.log("course/updatesection : CourseID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.description == null) {
            console.log("course/updatesection : Description cannot be null");
            res.status(400).end();
            return;
        }

        if (req.body.sectionid == null) {
            console.log("course/updatesection : sectionid cannot be null");
            res.status(400).end();
            return;
        }

        if (req.body.name == null) {
            console.log("course/updatesection : name cannot be null");
            res.status(400).end();
            return;
        }

        Section.update({
            Name: req.body.name,
            Description: req.body.description
        }, {
            where: {
                SectionID: req.body.sectionid,
                CourseID: req.body.courseid,
                SemesterID: req.body.semesterid
            }
        }).then(function(result) {
            Section.find({
                where: {
                    SectionID: req.body.sectionid,
                    CourseID: req.body.courseid,
                    SemesterID: req.body.semesterid
                }
            }).then(function(sectionUpdated) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "result": result,
                    "CourseUpdated": sectionUpdated
                });
            }).catch(function(err) {
                console.log('/course/update : ' + err);
                res.status(401).end();
            });
        })

    });

    //-----------------------------------------------------------------------------------------------------

    router.delete("/course/deleteuser", function(req, res) {

        SectionUser.destroy({
            where: {
                UserID: req.body.userID,
                SectionID: req.body.SectionID
            }
        }).then(function(rows) {
            console.log("Delete User Success");
            res.status(200).end();
        }).catch(function(err) {
            console.log("/course/deleteuser : " + err.message);

            res.status(400).end();
        });


    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to get a user's courses
    router.get("/course/getCourses/:userid", function(req, res) {

        SectionUser.findAll({
            where: {
                UserID: req.params.userid
            },
            attributes: ['SectionUserID', 'SectionID', 'UserROle', 'UserStatus'],
            include: [{
                model: Section,
                required: true,
                attributes: ['CourseID']
            }]
        }).then(function(rows) {
            if (rows.length > 0) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": rows
                });
            } else {
                res.json({
                    "Error": true,
                    "Message": "User Has No Courses"
                });
            }
        }).catch(function(err) {
            res.status(401).end();
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to get start a password reset request

    router.post("/resetPassword", function(req, res) {
        if (req.body.email == null) {
            console.log("/resetPassword : Email not sent");
            req.status(401).end();
            return;
        }
        var guid = Guid.create();
        //What is Guid?

        UserLogin.find({
            where: {
                Email: req.body.email
            }
        }).then(function(userlogin) {
            if (userlogin == null) {
                console.log("/resetPassword : Email does not exist");
                res.status(401).end();
            } else {
                User.find({
                    where: {
                        UserID: userlogin.UserID
                    }
                }).then(function(user) {
                    user.getResetPasswordRequest().then(function(PasswordRequest) {
                        Guid.isGuid(guid);
                        var value = guid.value;
                        if (PasswordRequest != null) {
                            ResetPasswordRequest.update({
                                RequestHash: value
                            }, {
                                where: {
                                    UserID: PasswordRequest.UserID
                                }
                            }).then(function() {
                                console.log("/resetPassword : Record updated ");
                                res.status(200).end();
                            });
                        } else {
                            var newRequest = ResetPasswordRequest.build({
                                UserID: user.UserID,
                                RequestHash: value
                            });
                            newRequest.save().then(function() {
                                console.log("/resetPassword : Record created ");
                                res.status(200).end();
                            }).catch(function(error) {
                                // Ooops, do some error-handling
                                console.log("/resetPassword : Error while inserting " + error.message);
                                res.status(401).end();
                            });

                        }
                    });
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //still need fixing
    router.get("/getPasswordResetRequest", function(req, res) {
        /*var query = "select ?? from ?? where ??=?";
        var table = ["UserID", "ResetPasswordRequest", "RequestHash", req.query.PasswordHash];
        query = mysql.format(query, table);
        connection.query(query, function(err, result) {
            if (err) {
                console.log("/getPasswordResetRequest : " + err.message);
                res.status(404).end();
            } else {
                if (result.length > 0) {
                    console.log("/getPasswordResetRequest : Request found");
                    res.json({
                        "Error": false,
                        "Message": "Success",
                        "UserID": result
                    });
                } else {
                    console.log("/getPasswordReset : Request not found");
                    res.json({
                        "Error": true,
                        "Message": "Request Password not found"
                    });
                }
            }
        });*/

        ResetPasswordRequest.find({
            where: {
                RequestHash: req.query.PasswordHash
            },
            attributes: ["UserID"]
        }).then(function(result) {
            if (result.length > 0) {
                console.log("/getPasswordResetRequest : Request found");
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "UserID": result
                });
            } else {
                console.log("/getPasswordReset : Request not found");
                res.json({
                    "Error": true,
                    "Message": "Request Password not found"
                });
            }
        }).catch(function(err) {
            console.log("/getPasswordResetRequest : " + err.message);
            res.status(404).end();
        });
    });

    //-----------------------------------------------------------------------------------------------------

    router.post("/password/reset", function(req, res) {
        if (req.body.HashRequest == null) {
            console.log("/resetPassword : HashRequest not sent");
            req.status(401).end();
        }
        if (req.body.newPassword == null) {
            console.log("/resetPassword : newPassword not sent");
            req.status(401).end();
        }
        User.find({
            where: {
                UserID: userlogin.UserID
            }
        }).then(function(user) {
            ResetPasswordRequest.find({
                where: {
                    RequestHash: req.body.HashRequest
                }
            }).then(function(request) {
                if (request == null) {
                    console.log("/resetPassword : HashRequest does not exist");
                    res.status(401).end();
                } else {
                    UserLogin.update({
                        Password: md5(req.body.newPassword)
                    }, {
                        where: {
                            UserID: request.UserID
                        }
                    }).then(function() {
                        request.destroy();
                        console.log("/resetPassword : Password updated");
                        res.status(200).end();
                    });
                }
            });
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to Get Courses Created by an Instructor
    router.get("/getCourseCreated/:instructorID", function(req, res) {
        Course.findAll({
            where: {
                CreatorID: req.params.instructorID
            }
        }).then(function(Courses) {
            console.log("/getCourseCreated/ Courses found");
            res.json({
                "Error": false,
                "Courses": Courses
            });
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to make a user an admin
    router.put("/makeUserAdmin/", function(req, res) {

        User.findById(req.body.UserID).then(function(user) {
            if (user == null) {
                console.log("/makeUserAdmin/ User not found");
                res.status(401).end();
            } else {
                user.Admin = 1;
                user.save().then(function() {
                    console.log("/makeUserAdmin : User Updated ");
                    res.status(200).end();
                }).catch(function(error) {
                    // Ooops, do some error-handling
                    console.log("/makeUserAdmin : Error while inserting " + error.message);
                    res.status(401).end();
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to make a user not an admin
    router.put("/makeUserNotAdmin/", function(req, res) {
        UserLogin.find({
            where: {
                UserID: req.body.UserID,
                Password: md5(req.body.password)
            }
        }).then(function(userLogin) {
            if (userLogin == null) {
                console.log("/makeUserNoAdmin : Authentication Failed");
                res.status(401).end();
            } else {
                User.findById(req.body.UserID).then(function(user) {
                    if (user == null) {
                        console.log("/makeUserNotAdmin/ User not found");
                        res.status(401).end();
                    } else {
                        user.Admin = 0;
                        user.save().then(function() {
                            console.log("/makeUserNotAdmin : User Updated ");
                            res.status(200).end();
                        }).catch(function(error) {
                            // Ooops, do some error-handling
                            console.log("/makeUserNoAdmin : Error while inserting " + error.message);
                            res.status(401).end();
                        });
                    }
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Assign a New Instructor
    router.put("/instructor/new", function(req, res) {
        var email = req.body.email;
        UserLogin.find({
            where: {
                Email: email
            },
            attributes: ['UserID']
        }).then(function(userID) {
            if (userID == null) {
                console.log('Email Not Found - Making Instructor ' + email);
                UserContact.create({
                    Email: email,
                    Phone: 'XXX-XXX-XXXX'
                }).catch(function(err) {
                    console.log(err);
                }).then(function(userCon) {
                    User.create({
                        FirstName: 'Temp',
                        LastName: 'Temp',
                        OrganizationGroup: {
                            "OrganizationID": []
                        },
                        UserContactID: userCon.UserContactID,
                        UserType: 'Instructor',
                        Admin: 0
                    }).catch(function(err) {
                        console.log(err);
                    }).then(function(user) {
                        UserLogin.create({
                            UserID: user.UserID,
                            Email: email,
                            Password: md5('pass123')
                        }).catch(function(err) {
                            console.log(err);
                        }).then(function(userLogin) {
                            //Email User With Password
                            console.log('/instructor/new made');
                            res.status(200).end();
                        });
                    });
                });
            } else {
                User.find({
                    where: {
                        UserID: userID.UserID
                    },
                    attributes: ['UserType', 'UserID']
                }).then(function(makerID) {
                    if (makerID.UserType != 'Instructor') {
                        makerID.updateAttributes({
                            UserID: makerID.UserID,
                            UserType: 'Instructor'
                        }).success(function() {
                            console.log('/instructor/new : success');
                            res.status(200).end();
                        });
                    } else {
                        console.log('/instructor/new : already instructor');
                        res.status(400).end();
                    }
                });
            }
        });
    });

    //-----------------------------------------------------------------------------------------------------


    //Get All Instructors
    router.get("/instructor/all", function(req, res) {
        User.findAll({
            where: {
                UserType: 'Instructor'
            },
            attributes: ['UserID', 'FirstName', 'LastName', 'Admin']
        }).then(function(instructors) {
            console.log("/instructors called");
            res.json({
                "Instructors": instructors
            });
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Get UserID from Email
    router.get("/getUserID/:email", function(req, res) {
        UserLogin.find({
            where: {
                Email: req.params.email
            }
        }).then(function(user) {
            res.json({
                "UserID": user.UserID
            });
        }).catch(function(e) {
            console.log("getUserID " + e);
            res.json({
                "UserID": -1
            });
        });
    });

    //-----------------------------------------------------------------------------------------------------

    //Endpoint to Get Pending Tasks
    router.get("/taskInstance/:userid", function(req, res) {
        TaskInstance.findAll({
            where: {
                UserID: req.params.userid
            }
        }).then(function(taskInstance) {
            res.json({
                "TaskInstances": taskInstance
            });
        }).catch(function(e) {
            console.log("/taskInstanceInstance/:userid " + e);
            res.json({
                "TaskInstances": -1
            });
        });
    });

    //-----------------------------------------------------------------------------------------------------

    router.post("assignment/section", function(req, res) {
        AssignmentInstance.create({
            AssignmentID: req.body.assignmentid,
            SectionID: req.body.sectionid
        }).save().then(function() {
            console.log('/assignment/section success');
            res.status(200).end();
        }).catch(function(e) {
            console.log('/assignment/section ' + e);
            res.status(400).end();
        });
    });

    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/main/:taskInstanceID", function(req, res) {
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceID
            }
        }).then(function(taskInstanceResult) {
            TaskActivity.find({
                where: {
                    TaskActivityID: taskInstanceResult.TaskActivityID
                }
            }).then(function(taskActivityResult) {
                Course.find({
                    where: {
                        CourseID: req.query.courseID
                    }
                }).then(function(courseResult) {
                    Assignment.find({
                        where: {
                            UserID: req.query.userID
                        }
                    }).then(function(assignmentResult) {
                        Section.find({
                            where: {
                                SectionID: req.query.sectionID
                            }
                        }).then(function(sectionResult) {
                            Semester.find({
                                where: {
                                    SemesterID: sectionResult.SemesterID
                                }
                            }).then(function(semesterResult) {
                                res.json({
                                    "Error": false,
                                    "Message": "Success",
                                    "taskActivityID": taskInstanceResult.TaskActivityID,
                                    "taskActivityType": taskActivityResult.Type,
                                    "courseName": courseResult.Title,
                                    "courseNumber": courseResult.Number,
                                    "assignmentTitle": assignmentResult.Title,
                                    "assignmentID": assignmentResult.AssignmentID,
                                    "semesterID": sectionResult.SemesterID,
                                    "semesterName": semesterResult.Name
                                });
                            }).catch(function(err) {
                                //Catch error and print into console.
                                console.log('/taskInstanceTemplate/main/ ' + err);
                                res.status(400).end();
                            });
                        });
                    });
                });
            });
        });
    });

    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/create/:taskInstanceid", function(req, res) {

        //Find TaskInstance.AssignmentInstanceID from TaskInstance
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            //Find the particular AssignmentInstance using AssignmentInstanceID retrieved from TaskInstance.
            AssignmentInstance.find({
                where: {
                    AssignmentInstanceID: taskInstanceResult.AssignmentInstanceID
                }
            }).then(function(assignmentInstanceResult) {
                //Access Assignment through AssignmentInstance.AssignmentID.
                Assignment.find({
                    where: {
                        AssignmentID: assignmentInstanceResult.AssignmentID
                    }
                }).then(function(assignmentResult) {
                    //Access TaskActivity through TaskInstance.TaskActivityID.
                    TaskActivity.find({
                        where: {
                            TaskActivityID: taskInstanceResult.TaskActivityID
                        }
                    }).then(function(taskActivityResult) {
                        //Returns json
                        res.json({
                            "Error": false,
                            "Message": "Success",
                            "assignmentDescription": assignmentResult.Description,
                            "taskInstruction": taskActivityResult.Instructions
                        });
                    }).catch(function(err) {
                        console.log('/taskInstanceTemplate/create/ ' + err);
                        res.status(404).end();
                    });
                });
            });
        });
    });

    router.post("/taskInstanceTemplate/create/submit", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/create/submit : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/create/submit : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/create/submit : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/taskInstanceTemplate/create/submit : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Change Task_status to Complete and store userCreatedProblem
            result.update({
                Status: 'Complete',
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/create/submit ' + err);
                res.status(400).end();
            });

        });

    });

    router.post("/taskInstanceTemplate/create/save", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/create/save : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/create/save : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/create/save : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/taskInstanceTemplate/create/save : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Task_Status remains incomplete and store userCreatedProblem
            result.update({
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/create/save ' + err);
                res.status(400).end();
            });

        });

    });

    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/edit/:taskInstanceid", function(req, res) {
        //Find TaskInstance.AssignmentInstanceID from TaskInstance
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            //Find the particular AssignmentInstance using AssignmentInstanceID retrieved from TaskInstance.
            AssignmentInstance.find({
                where: {
                    AssignmentInstanceID: taskInstanceResult.AssignmentInstanceID
                }
            }).then(function(assignmentInstanceResult) {
                //Access Assignment through AssignmentInstance.AssignmentID.
                Assignment.find({
                    where: {
                        AssignmentID: assignmentInstanceResult.AssignmentID
                    }
                }).then(function(assignmentResult) {
                    //Access TaskActivity through TaskInstance.TaskActivityID.
                    TaskActivity.find({
                        where: {
                            TaskActivityID: taskInstanceResult.TaskActivityID
                        }
                    }).then(function(taskActivityResult) {
                        TaskInstance.find({
                            where: {
                                TaskInstanceID: taskInstanceResult.ReferencedTask
                            }
                        }).then(function(createdProblemTaskResult) {
                            //Returns json
                            res.json({
                                "Error": false,
                                "Message": "Success",
                                "ProblemText": createdProblemTaskResult.Data,
                                "assignmentDescription": assignmentResult.Description,
                                "taskInstruction": taskActivityResult.Instructions,
                                "problem": taskInstanceResult.Data
                            });
                        }).catch(function(err) {
                            console.log('/taskInstanceTemplate/edit/ ' + err);
                            res.status(404).end();
                        });
                    });

                });
            });
        });
    });

    router.post("/taskInstanceTemplate/edit/submit", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/edit/submit : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/edit/submit : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/edit/submit : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/taskInstanceTemplate/edit/submit : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Change Task_Status to Complete and store userCreatedProblem
            result.update({
                Status: 'Complete',
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/edit/submit ' + err);
                res.status(400).end();
            });

        });
    });

    router.post("/taskInstanceTemplate/edit/save", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/edit/save : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/edit/save : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/edit/save : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/taskInstanceTemplate/edit/save : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Change Task_status to Complete and store userCreatedProblem
            result.update({
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/edit/save ' + err);
                res.status(400).end();
            });

        });
    });

    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/solve/:taskInstanceid", function(req, res) {
        //Find TaskInstance.AssignmentInstanceID from TaskInstance
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            //Find the particular AssignmentInstance using AssignmentInstanceID retrieved from TaskInstance.
            AssignmentInstance.find({
                where: {
                    AssignmentInstanceID: taskInstanceResult.AssignmentInstanceID
                }
            }).then(function(assignmentInstanceResult) {
                //Access Assignment through AssignmentInstance.AssignmentID.
                Assignment.find({
                    where: {
                        AssignmentID: assignmentInstanceResult.AssignmentID
                    }
                }).then(function(assignmentResult) {
                    //Access TaskActivity through Task.TaskActivityID.
                    TaskActivity.find({
                        where: {
                            TaskActivityID: taskInstanceResult.TaskActivityID
                        }
                    }).then(function(taskActivityResult) {
                        TaskInstance.find({
                            where: {
                                TaskInstanceID: taskInstanceResult.ReferencedTask
                            }
                        }).then(function(editProblemTaskResult) {
                            //Returns json
                            res.json({
                                "Error": false,
                                "Message": "Success",
                                "ProblemText": editProblemTaskResult.Data,
                                "assignmentDescription": assignmentResult.Description,
                                "taskInstruction": taskActivityResult.Instructions,
                                "problem": taskInstanceResult.Data
                            });
                        }).catch(function(err) {
                            console.log('/taskInstanceTemplate/edit/ ' + err);
                            res.status(404).end();
                        });
                    });

                });
            });
        });
    });

    router.post("/taskInstanceTemplate/solve/submit", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/solve/submit : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/solve/submit : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/solve/submit : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/taskInstanceTemplate/solve/submit : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Change Task_Status to Complete and store userCreatedProblem
            result.update({
                Status: 'Complete',
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/solve/submit ' + err);
                res.status(400).end();
            });

        });
    });

    router.post("/taskInstanceTemplate/solve/save", function(req, res) {
        if (req.body.taskInstanceid == null) {
            console.log("/taskInstanceTemplate/solve/save : TaskInstanceID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.userid == null) {
            console.log("/taskInstanceTemplate/solve/save : UserID cannot be null");
            res.status(400).end();
            return;
        }
        if (req.body.taskInstanceData == null) {
            console.log("/taskInstanceTemplate/solve/save : Data cannot be null");
            res.status(400).end();
            return;
        }

        TaskInstance.find({
            where: {
                TaskInstanceID: req.body.taskInstanceid,
                UserID: req.body.userid
            }
        }).then(function(result) {
            //Ensure userid input matches TaskInstance.UserID
            if (req.body.userid != result.UserID) {
                console.log("/TaskInstanceTemplate/solve/save : UserID Incorrect Match");
                res.status(400).end();
                return;
            }

            //Change Task_Status to Complete and store userCreatedProblem
            result.update({
                Data: req.body.taskInstanceData

            }).then(function(response) {
                res.json({
                    "Error": false,
                    "Message": "Success",
                    "Result": response
                });
            }).catch(function(err) {
                console.log('/taskInstanceTemplate/solve/save ' + err);
                res.status(400).end();
            });

        });
    });
    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/grade/:taskInstanceid", function(req, res) {
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            TaskInstance.find({
                where: {
                    TaskInstanceID: taskInstanceResult.ReferencedTask
                }
            }).then(function(solvedProblemResult) {
                TaskInstance.find({
                    where: {
                        TaskInstanceID: solvedProblemResult.ReferencedTask
                    }
                }).then(function(editProblemTaskResult) {
                    TaskActivity.find({
                        where: {
                            TaskActivityID: taskInstanceResult.TaskActivityID
                        }
                    }).then(function(taskActivityResult) {
                        res.json({
                            "Error": false,
                            "Message": "Success",
                            "editProblem": editProblemTaskResult.Data,
                            "sovledProblem": solvedProblemResult.Data,
                            "taskInstruction": taskActivityResult.Instructions,
                            "problem": taskInstanceResult.Data
                        });
                    }).catch(function(err) {
                        console.log('/taskInstanceTemplate/grade/ ' + err);
                        res.status(404).end();
                    });
                });
            });
        });
    });


    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/dispute/:taskInstanceid", function(req, res) {
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            TaskInstance.find({
                where: {
                    TaskInstanceID: taskInstanceResult.ReferencedTask
                }
            }).then(function(gradeResult) {
                TaskInstance.find({
                    where: {
                        TaskInstanceID: gradeResult.ReferencedTask
                    }
                }).then(function(solvedProblemResult) {
                    TaskInstance.find({
                        where: {
                            TaskInstanceID: solvedProblemResult.ReferencedTask
                        }
                    }).then(function(editProblemTaskResult) {
                        TaskActivity.find({
                            where: {
                                TaskActivityID: taskInstanceResult.TaskActivityID
                            }
                        }).then(function(taskActivityResult) {
                            res.json({
                                "Error": false,
                                "Message": "Success",
                                "editProblem": editProblemTaskResult.Data,
                                "sovledProblem": solvedProblemResult.Data,
                                "gradeProblem": gradeResult.Data,
                                "taskInstruction": taskActivityResult.Instructions,
                                "problem": taskInstanceResult.Data
                            });
                        }).catch(function(err) {
                            console.log('/taskInstanceTemplate/dispute/ ' + err);
                            res.status(404).end();
                        });
                    });
                });
            });
        });
    });


    //---------------------------------------------------------------------------------------------------------------------------------------------

    router.get("/taskInstanceTemplate/resolve/:taskInstanceid", function(req, res) {
        TaskInstance.find({
            where: {
                TaskInstanceID: req.params.taskInstanceid
            }
        }).then(function(taskInstanceResult) {
            TaskInstance.find({
                where: {
                    TaskInstanceID: taskInstanceResult.ReferencedTask
                }
            }).then(function(disputedResult) {
                TaskInstance.find({
                    where: {
                        TaskInstanceID: disputedResult.ReferencedTask
                    }
                }).then(function(gradeResult) {
                    TaskInstance.find({
                        where: {
                            TaskInstanceID: gradeResult.ReferencedTask
                        }
                    }).then(function(solvedProblemResult) {
                        TaskInstance.find({
                            where: {
                                TaskInstanceID: solvedProblemResult.ReferencedTask
                            }
                        }).then(function(editProblemTaskResult) {
                            TaskActivity.find({
                                where: {
                                    TaskActivityID: taskInstanceResult.TaskActivityID
                                }
                            }).then(function(taskActivityResult) {
                                res.json({
                                    "Error": false,
                                    "Message": "Success",
                                    "editProblem": editProblemTaskResult.Data,
                                    "sovledProblem": solvedProblemResult.Data,
                                    "gradeProblem": gradeResult.Data,
                                    "disputedProblem": disputedProblem.Data,
                                    "taskInstruction": taskActivityResult.Instructions,
                                    "problem": taskInstanceResult.Data
                                });
                            }).catch(function(err) {
                                console.log('/taskInstanceTemplate/dispute/ ' + err);
                                res.status(404).end();
                            });
                        });
                    });
                });
            });
        });
    });

    //---------------------------------------------------------------------------------------------------------------------------------------------


    //Endpoint to get the PendingTasks of users
    /* Need to only pick relevant data. Too big, could cause scaling slowdown issues
    Most likely: TaskInstanceID,UserID,WorlkflowID, StartDate,EndDate,Status from TaskInstance; Name,Visual_ID from TaskActivity; Name from WorkflowActivity
    */
    router.get("/getPendingTaskInstances/:userID", function(req, res) {
        TaskInstance.findAll({
            where: {
                UserID: req.params.userID,
                Status: "Incomplete"
            },
            attributes: ["TaskInstanceID", "UserID", "WorkflowInstanceID", "StartDate", "EndDate", "Status"],
            include: [ ///// Need new mappings in index.js AssignmentInstance -> Assignment, Assignment ::=> AssignmentInstance
                {
                    model: AssignmentInstance,
                    attributes: ["AssignmentInstanceID", "AssignmentID"],
                    include: [{
                        model: Section,
                        attributes: ["SectionID"],
                        include: [{
                            model: Course,
                            attributes: ["Title", "CourseID"]
                        }]

                    }, {
                        model: Assignment,
                        attributes: ["Title"]
                    }]
                },
                /*TaskInstance - > AssignmentInstance - > Section - > Course */
                {
                    model: TaskActivity,
                    attributes: ["Name", "Type", "VisualID"],
                    include: [{
                        model: WorkflowActivity,
                        attributes: ["Name"]
                    }]
                }
            ]
        }).then(function(taskInstances) {
            console.log("/getPendingTaskInstances/ TaskInstances found");
            res.json({
                "Error": false,
                "PendingTaskInstances": taskInstances
            }).catch(function(err) {
                console.log('/getPendingTaskInstances: ' + err);
                res.status(404).end();
            });
        });


    });

    router.get("/getCompletedTaskInstances/:userID", function(req, res) {
        TaskInstance.findAll({
            where: {
                UserID: req.params.userID,
                Status: "Complete"
            },
            attributes: ["TaskInstanceID", "UserID", "WorkflowInstanceID", "StartDate", "EndDate", "Status"],
            include: [ ///// Need new mappings in index.js AssignmentInstance -> Assignment, Assignment ::=> AssignmentInstance
                {
                    model: AssignmentInstance,
                    attributes: ["AssignmentInstanceID", "AssignmentID"],
                    include: [{
                        model: Section,
                        attributes: ["SectionID"],
                        include: [{
                            model: Course,
                            attributes: ["Title", "CourseID"]
                        }]

                    }, {
                        model: Assignment,
                        attributes: ["Title"]
                    }]
                },
                /*, {
                                       model: Section,
                                       attributes: ['SectionID'],
                                       include: [{
                                           model: Course,
                                           attributes: ["Title"]
                                       }]
                                   } */
                /*TaskInstance - > AssignmentInstance - > Section - > Course */
                {
                    model: TaskActivity,
                    attributes: ["Name", "Type", "VisualID"],
                    include: [{
                        model: WorkflowActivity,
                        attributes: ["Name"]
                    }]
                }
            ]
        }).then(function(taskInstances) {
            console.log("/getCompletedTaskInstances/ TaskInstances found");
            res.json({
                "Error": false,
                "CompletedTaskInstances": taskInstances
            }).catch(function(err) {
                console.log('/getCompletedTaskInstances: ' + err);
                res.status(404).end();
            });
        });
    });

    router.get('/getAssignmentRecord/:assignmentInstanceid', function(req, req) {

        AssignmentInstance.find({
            where: {
                AssignmentInstanceID: req.params.assignmentInstanceid
            },
            attributes: ['Title']
        }).then(function(AI_Result) {
            WorkflowInstance.findAll({
                where: {
                    AssignmentInstanceID: AI_Result.AssignmentInstanceID
                }
                // include: [{
                //     model: WorkflowActivity,
                //     attributes: ['Type']
                // }]
            }).then(function(WI_Result) {
                var tasks = [];

                for (var workflowInstance in WI_Result) {
                    var tempTasks = [];

                    for (var task in workflowInstance.TaskCollection) {
                        //each task is TaskInstanceID
                        TaskInstance.find({
                            where: {
                                TaskInstanceID: task
                            },
                            attributes: ['TaskInstanceID', 'Status'],
                            include: [{
                                model: User,
                                attributes: ['UserID', 'UserName']
                            }, {
                                model: TaskActivity,
                                attributes: ['Type']
                            }]
                        }).then(function(taskInstanceResult) {
                            tempTasks.push(taskInstanceResult);
                        });
                    }
                    tasks.push(tempTasks);
                }

                res.json({
                    "Error": false,
                    "AssignmentRecords": tasks
                });

            }).catch(function(err) {
                console.log('/getAssignmentRecord: ' + err);
                res.status(404).end();
            });
        });
    });

    router.get('/superCall/:taskInstanceid', function(req, res) {
        //     var superTask = [];
        //
        //     TaskInstance.find({
        //         where: {
        //             TaskInstanceID: req.params.taskInstanceid
        //         }
        //     }).then(function(result) {
        //         var taskArray = JSON.parse(JSON.parse(result.PreviousTasks));
        //         taskArray.push(req.params.taskInstanceid);
        //         return taskArray;
        //     }).then(function(taskarray) {
        //         console.log(taskarray);
        //         return Promise.map(taskarray, function(task) {
        //             TaskInstance.find({
        //                 where: {
        //                     TaskInstanceID: task
        //                 },
        //                 attributes: ["Data", "Status"],
        //                 include: [{
        //                     model: TaskActivity,
        //                     attributes: ["Type", "Rubric", "Instructions", "Fields", "NumberParticipants"]
        //                 }],
        //                 raw: true
        //             }).then(function(result) {
        //                 console.log('result ', result);
        //                 superTask.push(result);
        //             }).catch(function(err) {
        //                 console.log(err);
        //             });
        //         });
        //
        //     }).then(function(done) {
        //         console.log('done', done);
        //         if (done.length === superTask.length) {
        //             console.log('superTask.length', superTask.length)
        //             res.json({
        //                 "superTask": superTask
        //             });
        //         }
        //     }).catch(function(err) {
        //         console.log(err);
        //     });
        // });

        var superTask = [];

        sequelize.transaction(function(t) {
            "use strict";

            return TaskInstance.find({
                where: {
                    TaskInstanceID: req.params.taskInstanceid
                }
            }, {
                transaction: t
            }).then(function(result) {
                var taskArray = JSON.parse(JSON.parse(result.PreviousTasks));
                taskArray.push(JSON.parse(req.params.taskInstanceid));
                return taskArray;
            }).then(function(taskarray) {
                console.log(taskarray);
                return Promise.map(taskarray, function(task) {
                    return TaskInstance.find({
                        where: {
                            TaskInstanceID: task
                        },
                        attributes: ["TaskInstanceID", "Data", "Status"],
                        include: [{
                            model: TaskActivity,
                            attributes: ["Type", "Rubric", "Instructions", "Fields", "NumberParticipants"]
                        }],
                        raw: true
                    }, {
                        transaction: t
                    }).then(function(result) {
                        console.log('result ', result);
                        superTask.push(result);
                    }).catch(function(err) {
                        console.log(err);
                    });
                });


            }).then(function(done) {
                console.log('superTask.length', superTask.length)
                res.json({
                    "superTask": superTask.sort(function(a, b) {
                        var x = a.TaskInstanceID < b.TaskInstanceID ? -1 : 1;
                        return x;
                    })
                });
            }).catch(function(err) {
                console.log(err);
            });

        })

    });

    router.get('/getAssignToSection/:assignmentid', function(req, res) {
        Assignment.find({
            where: {
                AssignmentID: req.params.assignmentid
            },
            include: [{
                model: TaskActivity,
                attributes: ["TaskActivityID", "Type", "VisualID"],
                include: [{
                    model: WorkflowActivity,
                    attributes: ["Name"]
                }]
            }]
        }).then(function(result) {
            res.JSON({
                "Error": false,
                "AssignToSection": result
            });
        }).catch(function(err) {
            console.log('/getAssignToSection: ' + err);
            res.status(404).end();
        });
    });

}

module.exports = REST_ROUTER;
